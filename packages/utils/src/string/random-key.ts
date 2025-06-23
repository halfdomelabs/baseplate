import { customAlphabet } from 'nanoid';

const NUMBERS = '0123456789';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Use custom ID generator for characters that be easily selected
 */
const customNanoid = customAlphabet(`${NUMBERS}${LOWERCASE}${UPPERCASE}_`, 12);

/**
 * Generate a random key string made up of numbers, lowercase, and uppercase letters
 * @returns A random key string
 */
export function randomKey(length = 12): string {
  return customNanoid(length);
}
