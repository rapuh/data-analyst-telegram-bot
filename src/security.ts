import { timingSafeEqual } from 'node:crypto';

export function verifyTelegramSecret(received: string | null, expected: string | undefined): boolean {
  if (received === null || expected === undefined || expected.length === 0) {
    return false;
  }

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}
