import { describe, expect, it } from 'vitest';
import { encodeAnswerCallback, parseAnswerCallback } from '../src/callbacks.js';
import { buildAnswerText, buildQuestionMessage } from '../src/messages.js';
import { questions } from '../src/questions.js';
import { chooseQuestion } from '../src/random.js';

const sampleQuestion = {
  id: 'sql-001',
  topic: 'sql',
  difficulty: 'easy',
  prompt: 'Which clause filters grouped rows?',
  choices: ['WHERE', 'HAVING', 'ORDER BY', 'FROM'],
  answerIndex: 1,
  explanation: 'HAVING filters groups after aggregation.',
} as const;

describe('chooseQuestion', () => {
  it('selects the first question for a random value of zero', () => {
    expect(chooseQuestion(() => 0)).toBe(questions[0]);
  });

  it('selects the last question for a random value just below one', () => {
    expect(chooseQuestion(() => 0.999999999999)).toBe(questions.at(-1));
  });

  it('allows immediate repeats because each draw is independent', () => {
    const random = () => 0.25;

    expect(chooseQuestion(random)).toBe(chooseQuestion(random));
  });

  it.each([Number.NaN, -0.01, 1, Number.POSITIVE_INFINITY])('rejects invalid random value %s', (value) => {
    expect(() => chooseQuestion(() => value)).toThrow(RangeError);
  });
});

describe('answer callbacks', () => {
  it('round-trips a question ID and selected choice index', () => {
    expect(parseAnswerCallback(encodeAnswerCallback('python-042', 3))).toEqual({
      questionId: 'python-042',
      choiceIndex: 3,
    });
  });

  it('does not include the correct answer in callback data', () => {
    const callback = encodeAnswerCallback(sampleQuestion.id, 0);

    expect(callback).toBe('answer:sql-001:0');
    expect(callback).not.toContain(`:${sampleQuestion.answerIndex}`);
  });

  it.each(['answer:sql-001', 'answer::1', 'answer:sql-001:4', 'answer:sql-001:-1', 'answer:sql-001:one', 'other:sql-001:1'])(
    'rejects malformed callback data %s',
    (callback) => {
      expect(parseAnswerCallback(callback)).toBeNull();
    },
  );
});

describe('message rendering', () => {
  it('builds a four-button question message with option callbacks', () => {
    const message = buildQuestionMessage(sampleQuestion);

    expect(message.text).toContain('Topic: SQL');
    expect(message.text).toContain('Difficulty: Easy');
    expect(message.text).toContain(sampleQuestion.prompt);
    expect(message.reply_markup.inline_keyboard).toHaveLength(4);
    expect(message.reply_markup.inline_keyboard.flat()).toEqual([
      { text: 'A. WHERE', callback_data: 'answer:sql-001:0' },
      { text: 'B. HAVING', callback_data: 'answer:sql-001:1' },
      { text: 'C. ORDER BY', callback_data: 'answer:sql-001:2' },
      { text: 'D. FROM', callback_data: 'answer:sql-001:3' },
    ]);
  });

  it('renders the answer without referring to the selected option', () => {
    expect(buildAnswerText(sampleQuestion)).toBe(
      'Correct answer: B. HAVING\n\nHAVING filters groups after aggregation.',
    );
  });
});
