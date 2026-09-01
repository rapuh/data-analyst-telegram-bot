export type Topic = 'sql' | 'python-pandas-eda' | 'statistics' | 'excel' | 'tableau';

export type Difficulty = 'easy' | 'moderate' | 'hard';

export interface Question {
  readonly id: string;
  readonly topic: Topic;
  readonly difficulty: Difficulty;
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly answerIndex: number;
  readonly explanation: string;
}
