import type { QuestionMessage } from './messages.js';

export interface TelegramMessage {
  readonly text: string;
  readonly reply_markup?: QuestionMessage['reply_markup'];
}

export interface TelegramClient {
  sendMessage(chatId: number, message: TelegramMessage): Promise<void>;
  answerCallbackQuery(callbackId: string): Promise<void>;
}

export type FetchImplementation = typeof fetch;

function createRequest(token: string, fetchImpl: FetchImplementation) {
  return async (method: 'sendMessage' | 'answerCallbackQuery', body: Record<string, unknown>): Promise<void> => {
    let response: Response;

    try {
      response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error('Telegram API request failed.');
    }

    if (!response.ok) {
      throw new Error('Telegram API request failed.');
    }
  };
}

export function createTelegramClient(token: string, fetchImpl: FetchImplementation = fetch): TelegramClient {
  if (token.trim().length === 0) {
    throw new RangeError('Telegram bot token must be non-empty.');
  }

  const request = createRequest(token, fetchImpl);

  return {
    async sendMessage(chatId, message) {
      await request('sendMessage', { chat_id: chatId, ...message });
    },
    async answerCallbackQuery(callbackId) {
      await request('answerCallbackQuery', { callback_query_id: callbackId });
    },
  };
}
