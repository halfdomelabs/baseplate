import type { ReferencePath } from '#src/references/types.js';

import type {
  DefinitionFieldIssueChecker,
  FieldIssueResult,
} from './definition-issue-registry.js';

/**
 * Creates an issue checker that ensures a specific value for a given field
 * appears at most once in an array of objects.
 *
 * Used with `.apply(withIssueChecker(checkUniqueFieldValue(...)))` on array schemas.
 *
 * @param field - The field name to check
 * @param value - The specific value that should appear at most once
 * @param options.label - Human-readable label for the item type (e.g. "backend app")
 * @param options.severity - Severity level for duplicate issues (default: 'error')
 */
export function checkUniqueFieldValue<K extends string>(
  field: K,
  value: unknown,
  options: {
    label?: string;
    severity?: 'error' | 'warning';
  } = {},
): DefinitionFieldIssueChecker<Record<K, unknown>[]> {
  const { label = String(value), severity = 'error' } = options;

  return (items) => {
    const issues: FieldIssueResult[] = [];
    let firstIndex: number | undefined;

    for (const [i, item] of items.entries()) {
      if (item[field] !== value) continue;

      if (firstIndex === undefined) {
        firstIndex = i;
      } else {
        issues.push({
          message: `Only one ${label} is allowed`,
          path: [i, field],
          severity,
        });
      }
    }

    return issues;
  };
}

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

  return (items) => {
    const issues: FieldIssueResult[] = [];
    const seen = new Map<unknown, ReferencePath>();

    for (const [i, item] of items.entries()) {
      const value = item[field];
      if (value === undefined || value === null || value === '') continue;

      const existingPath = seen.get(value);
      if (existingPath) {
        issues.push({
          message: `Duplicate ${label} "${String(value)}"`,
          path: [i, field],
          severity,
        });
      } else {
        seen.set(value, [i, field]);
      }
    }

    return issues;
  };
}
