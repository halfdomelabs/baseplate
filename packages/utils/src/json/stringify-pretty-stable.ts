import sortKeys from 'sort-keys';

import { stringifyPrettyCompact } from './stringify-pretty-compact.js';

export function stringifyPrettyStable(value: Record<string, unknown>): string {
  const sortedValue = sortKeys(value, {
    deep: true,
  });
  return `${stringifyPrettyCompact(sortedValue)}\n`;
}
