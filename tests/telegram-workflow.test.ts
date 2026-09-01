import { describe, expect, it, vi } from 'vitest';
import { encodeAnswerCallback } from '../src/callbacks.js';
import { createTelegramClient, type TelegramClient } from '../src/telegram.js';
import { handleUpdate, type TelegramUpdate } from '../src/update-handler.js';

function makeClient(): TelegramClient & {
  readonly calls: Array<{ method: string; chatId?: number; message?: unknown; callbackId?: string }>;
} {
  const calls: Array<{ method: string; chatId?: number; message?: unknown; callbackId?: string }> = [];

  return {
    calls,
    async sendMessage(chatId, message) {
      calls.push({ method: 'sendMessage', chatId, message });
    },
    async answerCallbackQuery(callbackId) {
      calls.push({ method: 'answerCallbackQuery', callbackId });
    },
  };
}

describe('handleUpdate', () => {
  it('sends one random question for /start', async () => {
    const client = makeClient();
    const update: TelegramUpdate = { message: { chat: { id: 42 }, text: '/start' } };

    await handleUpdate(update, client, () => 0);

    expect(client.calls).toHaveLength(1);
    expect(client.calls[0]).toMatchObject({ method: 'sendMessage', chatId: 42 });
  });

  it('ignores plain text', async () => {
    const client = makeClient();

    await handleUpdate({ message: { chat: { id: 42 }, text: 'hello' } }, client);

    expect(client.calls).toEqual([]);
  });

  it('acknowledges a valid callback, then sends answer and next question in order', async () => {
    const client = makeClient();
    const update: TelegramUpdate = {
      callback_query: {
        id: 'callback-1',
        data: encodeAnswerCallback('sql-001', 0),
        message: { chat: { id: 42 } },
      },
    };

    await handleUpdate(update, client, () => 0.5);

    expect(client.calls.map((call) => call.method)).toEqual([
      'answerCallbackQuery',
      'sendMessage',
      'sendMessage',
    ]);
    expect(client.calls[0]).toEqual({ method: 'answerCallbackQuery', callbackId: 'callback-1' });
    expect(client.calls[1]).toMatchObject({ method: 'sendMessage', chatId: 42 });
    expect(client.calls[2]).toMatchObject({ method: 'sendMessage', chatId: 42 });
  });

  it('safely acknowledges malformed callbacks without sending a message', async () => {
    const client = makeClient();
    const update: TelegramUpdate = {
      callback_query: { id: 'callback-1', data: 'wrong', message: { chat: { id: 42 } } },
    };

    await handleUpdate(update, client);

    expect(client.calls).toEqual([{ method: 'answerCallbackQuery', callbackId: 'callback-1' }]);
  });

  it('safely acknowledges stale callbacks without sending a message', async () => {
    const client = makeClient();
    const update: TelegramUpdate = {
      callback_query: {
        id: 'callback-1',
        data: encodeAnswerCallback('sql-999', 2),
        message: { chat: { id: 42 } },
      },
    };

    await handleUpdate(update, client);

    expect(client.calls).toEqual([{ method: 'answerCallbackQuery', callbackId: 'callback-1' }]);
  });
});

describe('Telegram client', () => {
  it('POSTs JSON to Telegram sendMessage', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
    const client = createTelegramClient('token-value', fetchImpl);

    await client.sendMessage(42, { text: 'Question', reply_markup: { inline_keyboard: [] } });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.telegram.org/bottoken-value/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: 42, text: 'Question', reply_markup: { inline_keyboard: [] } }),
      }),
    );
  });

  it('throws a sanitized error when Telegram rejects a request', async () => {
    const fetchImpl = vi.fn(async () => new Response('token-value failed', { status: 500 }));
    const client = createTelegramClient('token-value', fetchImpl);

    await expect(client.answerCallbackQuery('callback-1')).rejects.toThrow('Telegram API request failed.');
  });
});
