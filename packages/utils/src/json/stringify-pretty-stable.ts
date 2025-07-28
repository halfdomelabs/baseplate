import sortKeys from 'sort-keys';

import { stringifyPrettyCompact } from './stringify-pretty-compact.js';

/**
 * Stringifies a value with stable pretty printing.
 *
 * That means the keys are sorted and the value is pretty printed.
 *
 * @param value - The value to stringify.
 * @returns The stringified value.
 */
export function stringifyPrettyStable(value: object): string {
  const sortedValue = sortKeys(value, {
    deep: true,
  });
  return `${stringifyPrettyCompact(sortedValue)}\n`;
}
