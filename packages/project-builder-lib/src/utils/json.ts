import sortKeys from 'sort-keys';

import { stringify } from './json-stringify-pretty-compact.js';

export function prettyStableStringify(config: Record<string, unknown>): string {
  const stableConfig = sortKeys(config, {
    deep: true,
  });
  return `${stringify(stableConfig, {
    objectMargins: true,
  })}\n`;
}
