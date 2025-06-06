import { escapeRegExp } from 'es-toolkit';
import path from 'node:path';

import type { TsPathMapEntry } from './types.js';

/**
 * Generate TsPathMapEntry list from baseUrl and paths.
 *
 * @param baseUrl The base URL of the project
 * @param paths The paths to generate the TsPathMapEntry list from
 * @returns A list of TsPathMapEntry
 */
export function generatePathMapEntries(
  baseUrl: string | undefined,
  paths: Record<string, string[]>,
): TsPathMapEntry[] {
  return Object.entries(paths).flatMap(([alias, targets]) => {
    if (targets.length !== 1) {
      throw new Error('We do not support tsconfig paths with multiple values');
    }
    return [
      {
        from: alias,
        to: `./${path.posix.join(baseUrl ?? '.', targets[0]).replaceAll('\\', '/')}`,
      },
    ];
  });
}

/**
 * Convert TsPathMapEntry list to regexes matching internal modules.
 * Handles entries with and without a single wildcard '*'.
 *
 * @param entries The TsPathMapEntry list to convert to regexes
 * @returns A list of regexes
 */
export function pathMapEntriesToRegexes(entries: TsPathMapEntry[]): RegExp[] {
  return entries.map(({ from }) => {
    if (from.includes('*')) {
      const [prefix, suffix] = from.split('*');
      return new RegExp(`^${escapeRegExp(prefix)}.*${escapeRegExp(suffix)}$`);
    }
    return new RegExp(`^${escapeRegExp(from)}$`);
  });
}
