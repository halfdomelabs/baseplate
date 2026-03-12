import type { ReferencePath } from '#src/references/types.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

/**
 * An auto-fix proposal attached to an issue.
 *
 * Exactly one of `apply` or `applySetter` should be provided:
 * - `apply`: for field-level fixes that transform the local value at the issue path
 * - `applySetter`: for definition-level fixes that can mutate any part of the definition
 */
export interface DefinitionIssueFix {
  /** Short label for the fix action (e.g. "Remove duplicate port") */
  readonly label: string;
  /** Apply the fix to the local value, returning a fixed value (field-level fixes) */
  readonly apply?: (value: unknown) => unknown;
  /** Apply the fix to the full definition draft via Immer (definition-level fixes) */
  readonly applySetter?: (draft: ProjectDefinition) => void;
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
