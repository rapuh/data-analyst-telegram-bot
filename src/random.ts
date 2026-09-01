import { questions } from './questions.js';
import type { Question } from './types.js';

export function chooseQuestion(random: () => number = Math.random): Question {
  const value = random();

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Random value must be greater than or equal to 0 and less than 1.');
  }

  const question = questions[Math.floor(value * questions.length)];

  if (question === undefined) {
    throw new Error('Question bank is empty.');
  }

  return question;
}
