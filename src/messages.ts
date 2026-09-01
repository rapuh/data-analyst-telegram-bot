import { encodeAnswerCallback } from './callbacks.js';
import type { Question, Topic } from './types.js';

export interface InlineKeyboardButton {
  readonly text: string;
  readonly callback_data: string;
}

export interface QuestionMessage {
  readonly text: string;
  readonly reply_markup: {
    readonly inline_keyboard: readonly (readonly InlineKeyboardButton[])[];
  };
}

const optionLetters = ['A', 'B', 'C', 'D'] as const;

const topicLabels: Record<Topic, string> = {
  sql: 'SQL',
  'python-pandas-eda': 'Python, Pandas & EDA',
  statistics: 'Statistics',
  excel: 'Excel',
  tableau: 'Tableau',
};

function titleCase(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export function buildQuestionMessage(question: Question): QuestionMessage {
  return {
    text: `Topic: ${topicLabels[question.topic]}\nDifficulty: ${titleCase(question.difficulty)}\n\n${question.prompt}`,
    reply_markup: {
      inline_keyboard: question.choices.map((choice, choiceIndex) => [
        {
          text: `${optionLetters[choiceIndex]}. ${choice}`,
          callback_data: encodeAnswerCallback(question.id, choiceIndex),
        },
      ]),
    },
  };
}

export function buildAnswerText(question: Question): string {
  const letter = optionLetters[question.answerIndex];
  const answer = question.choices[question.answerIndex];

  return `Correct answer: ${letter}. ${answer}\n\n${question.explanation}`;
}
