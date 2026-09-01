import { describe, expect, it, vi } from 'vitest';
import { handleWebhookRequest } from '../api/webhook.js';
import { verifyTelegramSecret } from '../src/security.js';
import type { TelegramClient } from '../src/telegram.js';

const configuredEnvironment = {
  TELEGRAM_BOT_TOKEN: 'server-side-token',
  TELEGRAM_WEBHOOK_SECRET: 'server-side-secret',
};

function request(options: {
  readonly method?: string;
  readonly secret?: string;
  readonly body?: string;
} = {}): Request {
  return new Request('https://example.test/api/webhook', {
    method: options.method ?? 'POST',
    headers: options.secret === undefined ? {} : { 'x-telegram-bot-api-secret-token': options.secret },
    body: options.body,
  });
}

function dependencies(overrides: Partial<Parameters<typeof handleWebhookRequest>[1]> = {}) {
  const client: TelegramClient = {
    async sendMessage() {},
    async answerCallbackQuery() {},
  };

  return {
    environment: configuredEnvironment,
    createClient: vi.fn(() => client),
    handleUpdate: vi.fn(async () => {}),
    ...overrides,
  };
}

describe('verifyTelegramSecret', () => {
  it('rejects a secret with the wrong value', () => {
    expect(verifyTelegramSecret('different-secret', 'server-side-secret')).toBe(false);
  });

  it('rejects a secret with a different byte length', () => {
    expect(verifyTelegramSecret('short', 'server-side-secret')).toBe(false);
  });

  it('accepts an exact secret match', () => {
    expect(verifyTelegramSecret('server-side-secret', 'server-side-secret')).toBe(true);
  });
});

describe('handleWebhookRequest', () => {
  it('rejects non-POST methods before reading the payload', async () => {
    const response = await handleWebhookRequest(request({ method: 'GET' }), dependencies());

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    await expect(response.text()).resolves.toBe('Method not allowed.');
  });

  it('rejects a request without Telegram’s secret header', async () => {
    const response = await handleWebhookRequest(request({ body: '{}' }), dependencies());

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe('Unauthorized.');
  });

  it('rejects a request with an incorrect Telegram secret header', async () => {
    const response = await handleWebhookRequest(
      request({ secret: 'incorrect', body: '{}' }),
      dependencies(),
    );

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe('Unauthorized.');
  });

  it('returns a sanitized configuration error when environment variables are missing', async () => {
    const response = await handleWebhookRequest(
      request({ secret: 'server-side-secret', body: '{}' }),
      dependencies({ environment: {} }),
    );

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe('Webhook configuration unavailable.');
  });

  it('rejects malformed JSON without delegating to the update handler', async () => {
    const deps = dependencies();
    const response = await handleWebhookRequest(
      request({ secret: 'server-side-secret', body: '{' }),
      deps,
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe('Invalid request payload.');
    expect(deps.handleUpdate).not.toHaveBeenCalled();
  });

  it('delegates a valid update to the handler and returns an empty success response', async () => {
    const deps = dependencies();
    const update = { update_id: 17, message: { chat: { id: 42 }, text: '/start' } };
    const response = await handleWebhookRequest(
      request({ secret: 'server-side-secret', body: JSON.stringify(update) }),
      deps,
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('');
    expect(deps.createClient).toHaveBeenCalledWith('server-side-token');
    expect(deps.handleUpdate).toHaveBeenCalledWith(update, expect.any(Object), expect.any(Function));
  });

  it('does not expose handler failures to Telegram', async () => {
    const deps = dependencies({ handleUpdate: vi.fn(async () => { throw new Error('private failure details'); }) });
    const response = await handleWebhookRequest(
      request({ secret: 'server-side-secret', body: '{}' }),
      deps,
    );

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe('Webhook processing failed.');
  });
});
