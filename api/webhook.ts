import { verifyTelegramSecret } from '../src/security.js';
import { createTelegramClient } from '../src/telegram.js';
import { handleUpdate, type TelegramUpdate } from '../src/update-handler.js';

export interface WebhookDependencies {
  readonly environment?: Readonly<Record<string, string | undefined>>;
  readonly createClient?: typeof createTelegramClient;
  readonly handleUpdate?: typeof handleUpdate;
  readonly random?: () => number;
}

function textResponse(status: number, text: string, headers?: HeadersInit): Response {
  return new Response(text, { status, headers });
}

export async function handleWebhookRequest(
  request: Request,
  dependencies: WebhookDependencies = {},
): Promise<Response> {
  if (request.method !== 'POST') {
    return textResponse(405, 'Method not allowed.', { allow: 'POST' });
  }

  const environment = dependencies.environment ?? process.env;
  const webhookSecret = environment.TELEGRAM_WEBHOOK_SECRET;
  const botToken = environment.TELEGRAM_BOT_TOKEN;

  if (
    webhookSecret === undefined ||
    webhookSecret.trim().length === 0 ||
    botToken === undefined ||
    botToken.trim().length === 0
  ) {
    return textResponse(500, 'Webhook configuration unavailable.');
  }

  if (!verifyTelegramSecret(request.headers.get('x-telegram-bot-api-secret-token'), webhookSecret)) {
    return textResponse(401, 'Unauthorized.');
  }

  let update: TelegramUpdate;

  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return textResponse(400, 'Invalid request payload.');
  }

  try {
    const client = (dependencies.createClient ?? createTelegramClient)(botToken);
    await (dependencies.handleUpdate ?? handleUpdate)(update, client, dependencies.random ?? Math.random);
    return new Response(null, { status: 200 });
  } catch {
    return textResponse(500, 'Webhook processing failed.');
  }
}

export default async function webhook(request: Request): Promise<Response> {
  return handleWebhookRequest(request);
}
