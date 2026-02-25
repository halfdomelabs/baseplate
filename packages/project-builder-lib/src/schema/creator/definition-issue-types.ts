import type { ReferencePath } from '#src/references/types.js';

/**
 * An auto-fix proposal attached to an issue.
 * The `apply` function receives the local value and returns a fixed value.
 */
export interface DefinitionIssueFix {
  /** Short label for the fix action (e.g. "Remove duplicate port") */
  readonly label: string;
  /** Apply the fix to the local value, returning a fixed value */
  readonly apply: (value: unknown) => unknown;
}

/**
 * A single issue found in the definition. May optionally propose an auto-fix.
 *
 * - `'error'` severity blocks saving and shows toast errors
 * - `'warning'` severity allows saving but blocks syncing, shown as toast warnings
 */
export interface DefinitionIssue {
  /** Human-readable description of the issue */
  readonly message: string;
  /** Path in the definition where the issue originated */
  readonly path: ReferencePath;
  /** Severity: 'error' blocks save, 'warning' blocks sync only */
  readonly severity: 'error' | 'warning';
  /** Optional auto-fix proposal */
  readonly fix?: DefinitionIssueFix;
}
