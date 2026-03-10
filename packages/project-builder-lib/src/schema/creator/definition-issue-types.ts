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
 * Common fields shared by all definition issues.
 *
 * - `'error'` severity blocks saving and shows toast errors
 * - `'warning'` severity allows saving but blocks syncing, shown as toast warnings
 */
interface DefinitionIssueBase {
  /** Human-readable description of the issue */
  readonly message: string;
  /** Severity: 'error' blocks save, 'warning' blocks sync only */
  readonly severity: 'error' | 'warning';
  /** Optional auto-fix proposal */
  readonly fix?: DefinitionIssueFix;
}

/**
 * An issue scoped to a specific entity. The path is relative to the entity root.
 */
export interface EntityDefinitionIssue extends DefinitionIssueBase {
  /** The entity this issue belongs to */
  readonly entityId: string;
  /** Path relative to the entity root */
  readonly path: ReferencePath;
}

/**
 * A root-level issue with an absolute path from the definition root.
 * Used for cross-cutting validations (e.g., duplicate names in arrays)
 * and settings that aren't scoped to a specific entity.
 */
export interface RootDefinitionIssue extends DefinitionIssueBase {
  readonly entityId?: undefined;
  /** Absolute path from the definition root */
  readonly path: ReferencePath;
}

/**
 * A definition issue is either entity-scoped or root-scoped.
 *
 * - Entity-scoped: has `entityId` (string) + path relative to entity root
 * - Root-scoped: no `entityId` + absolute path from definition root
 */
export type DefinitionIssue = EntityDefinitionIssue | RootDefinitionIssue;
