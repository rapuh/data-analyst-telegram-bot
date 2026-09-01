import { describe, expect, it } from 'vitest';
import { questions, questionsById } from '../src/questions.js';

const expectedCounts = {
  sql: 100,
  'python-pandas-eda': 180,
  statistics: 80,
  excel: 40,
  tableau: 60,
} as const;

describe('question bank contract', () => {
  it('contains the required number of questions for every topic', () => {
    for (const [topic, expectedCount] of Object.entries(expectedCounts)) {
      expect(questions.filter((question) => question.topic === topic)).toHaveLength(expectedCount);
    }
    expect(questions).toHaveLength(460);
  });

  it('exposes an index entry for every question ID', () => {
    expect(questionsById.size).toBe(questions.length);
    for (const question of questions) {
      expect(questionsById.get(question.id)).toBe(question);
    }
  });

  it('gives every question a unique ID and normalized prompt', () => {
    const ids = questions.map((question) => question.id);
    const normalizedPrompts = questions.map((question) => question.prompt.trim().replace(/\s+/g, ' ').toLowerCase());

    expect(new Set(ids)).toHaveLength(questions.length);
    expect(new Set(normalizedPrompts)).toHaveLength(questions.length);
  });

  it('uses only supported difficulties', () => {
    expect(questions.every((question) => ['easy', 'moderate', 'hard'].includes(question.difficulty))).toBe(true);
  });

  it('gives every question four non-empty unique choices and a valid answer index', () => {
    for (const question of questions) {
      expect(question.choices).toHaveLength(4);
      expect(question.choices.every((choice) => choice.trim().length > 0)).toBe(true);
      expect(new Set(question.choices.map((choice) => choice.trim().toLowerCase()))).toHaveLength(4);
      expect(Number.isInteger(question.answerIndex)).toBe(true);
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThanOrEqual(3);
      expect(question.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it('does not encode Tableau answers with a question-number or repeating-position formula', () => {
    const answerIndexes = questions
      .filter((question) => question.topic === 'tableau')
      .map((question) => question.answerIndex);

    const questionNumberMatches = answerIndexes.filter((answerIndex, index) => answerIndex === index % 4).length;
    const periodFourMatches = answerIndexes.slice(4).filter((answerIndex, index) => answerIndex === answerIndexes[index]).length;
    const periodTwelveMatches = answerIndexes.slice(12).filter((answerIndex, index) => answerIndex === answerIndexes[index]).length;

    expect(questionNumberMatches).toBeLessThanOrEqual(24);
    expect(periodFourMatches).toBeLessThanOrEqual(24);
    expect(periodTwelveMatches).toBeLessThanOrEqual(24);
  });
});
