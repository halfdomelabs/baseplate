import type { ReferencePath } from '#src/references/types.js';

import type { DefinitionFieldIssueChecker } from './definition-issue-registry.js';
import type { DefinitionIssue } from './definition-issue-types.js';

/**
 * Creates an issue checker that detects duplicate values for a given field
 * in an array of objects.
 *
 * Used with `.apply(withIssueChecker(checkUniqueField(...)))` on array schemas.
 *
 * @param field - The field name to check for uniqueness
 * @param options.label - Human-readable label for the field (e.g. "name", "port")
 * @param options.severity - Severity level for duplicate issues (default: 'error')
 */
export function checkUniqueField<K extends string>(
  field: K,
  options: {
    label?: string;
    severity?: 'error' | 'warning';
  } = {},
): DefinitionFieldIssueChecker<Record<K, unknown>[]> {
  const { label = field, severity = 'error' } = options;

  return (items, ctx) => {
    const issues: DefinitionIssue[] = [];
    const seen = new Map<unknown, ReferencePath>();

    for (const [i, item] of items.entries()) {
      const value = item[field];
      if (value === undefined || value === null || value === '') continue;

      const existingPath = seen.get(value);
      if (existingPath) {
        issues.push({
          message: `Duplicate ${label} "${String(value)}"`,
          path: [...ctx.path, i, field],
          severity,
        });
      } else {
        seen.set(value, [...ctx.path, i, field]);
      }
    }

    return issues;
  };
}
