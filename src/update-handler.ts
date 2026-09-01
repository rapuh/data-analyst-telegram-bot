import { parseAnswerCallback } from './callbacks.js';
import { buildAnswerText, buildQuestionMessage } from './messages.js';
import { questionsById } from './questions.js';
import { chooseQuestion } from './random.js';
import type { TelegramClient } from './telegram.js';

export interface TelegramUpdate {
  readonly message?: {
    readonly chat: { readonly id: number };
    readonly text?: string;
  };
  readonly callback_query?: {
    readonly id: string;
    readonly data?: string;
    readonly message?: { readonly chat: { readonly id: number } };
  };
}

export async function handleUpdate(
  update: TelegramUpdate,
  client: TelegramClient,
  random: () => number = Math.random,
): Promise<void> {
  if (update.message?.text === '/start') {
    await client.sendMessage(update.message.chat.id, buildQuestionMessage(chooseQuestion(random)));
    return;
  }

  const callback = update.callback_query;

  if (callback === undefined) {
    return;
  }

  await client.answerCallbackQuery(callback.id);

  const parsed = callback.data === undefined ? null : parseAnswerCallback(callback.data);
  const chatId = callback.message?.chat.id;
  const question = parsed === null ? undefined : questionsById.get(parsed.questionId);

  if (chatId === undefined || question === undefined) {
    return;
  }

  await client.sendMessage(chatId, { text: buildAnswerText(question) });
  await client.sendMessage(chatId, buildQuestionMessage(chooseQuestion(random)));
}
