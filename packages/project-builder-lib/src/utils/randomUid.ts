import { customAlphabet } from 'nanoid';

const NUMBERS = '0123456789';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Use custom ID generator for characters that be easily selected
 */
const customNanoid = customAlphabet(`${NUMBERS}${LOWERCASE}${UPPERCASE}_`, 12);

export function randomUid(): string {
  return customNanoid();
}
