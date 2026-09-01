import excel from '../data/questions/excel.json' with { type: 'json' };
import pythonPandasEda from '../data/questions/python-pandas-eda.json' with { type: 'json' };
import sql from '../data/questions/sql.json' with { type: 'json' };
import statistics from '../data/questions/statistics.json' with { type: 'json' };
import tableau from '../data/questions/tableau.json' with { type: 'json' };
import type { Question } from './types.js';

export const questions: readonly Question[] = [
  ...sql,
  ...pythonPandasEda,
  ...statistics,
  ...excel,
  ...tableau,
] as Question[];

export const questionsById: ReadonlyMap<string, Question> = new Map(
  questions.map((question) => [question.id, question]),
);
