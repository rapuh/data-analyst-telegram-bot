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

type VercelRequest = {
  readonly body?: unknown;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly method?: string;
  readonly url?: string;
};

type VercelResponse = {
  send(body: string): void;
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
};

function toFetchHeaders(headers: VercelRequest['headers']): Headers {
  const fetchHeaders = new Headers();

  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined) {
      fetchHeaders.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  return fetchHeaders;
}

export default async function webhook(request: VercelRequest, response: VercelResponse): Promise<void> {
  const headers = toFetchHeaders(request.headers);
  const protocol = headers.get('x-forwarded-proto') ?? 'https';
  const host = headers.get('host') ?? 'localhost';
  const method = request.method ?? 'POST';
  const body = method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(request.body ?? {});
  const result = await handleWebhookRequest(
    new Request(new URL(request.url ?? '/', `${protocol}://${host}`), { body, headers, method }),
  );

  result.headers.forEach((value, name) => response.setHeader(name, value));
  response.status(result.status).send(await result.text());
}
