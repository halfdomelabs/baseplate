import { customAlphabet } from 'nanoid';
import { alphanumeric } from 'nanoid-dictionary';

/**
 * Use custom ID generator for characters that be easily selected
 */
const customNanoid = customAlphabet(`${alphanumeric}_`, 12);

export function randomUid(): string {
  return customNanoid();
}
