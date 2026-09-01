export interface AnswerCallback {
  readonly questionId: string;
  readonly choiceIndex: number;
}

const callbackPattern = /^answer:([^:]+):([0-3])$/;

export function encodeAnswerCallback(questionId: string, choiceIndex: number): string {
  if (questionId.length === 0 || questionId.includes(':')) {
    throw new RangeError('Question ID must be non-empty and cannot contain a colon.');
  }

  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex > 3) {
    throw new RangeError('Choice index must be an integer from 0 to 3.');
  }

  return `answer:${questionId}:${choiceIndex}`;
}

export function parseAnswerCallback(callbackData: string): AnswerCallback | null {
  const match = callbackPattern.exec(callbackData);

  if (match === null) {
    return null;
  }

  return { questionId: match[1], choiceIndex: Number(match[2]) };
}
