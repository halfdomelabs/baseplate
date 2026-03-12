import { get, set } from 'es-toolkit/compat';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { ReferencePath } from '#src/references/types.js';
import type {
  DefinitionIssue,
  EntityDefinitionIssue,
} from '#src/schema/creator/definition-issue-types.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

/**
 * Resolves a definition issue's path to an absolute path in the definition.
 *
 * If the issue is scoped to an entity, combines the entity's path with the
 * issue's relative path. If no entity, returns the path as-is.
 */
export function resolveIssuePath(
  issue: DefinitionIssue,
  container: ProjectDefinitionContainer,
): ReferencePath {
  if (!issue.entityId) return issue.path;
  const entity = container.entityFromId(issue.entityId);
  if (!entity) return issue.path;
  return [...entity.path, ...issue.path];
}

/**
 * Creates a definition issue scoped to a specific entity.
 *
 * Validates that the entity exists in the container and returns an issue
 * with the entity ID and a relative path from the entity root.
 *
 * @param container - The project definition container
 * @param entityId - The entity ID to scope the issue to
 * @param relativePath - Path relative to the entity
 * @param issue - The issue message, severity, and optional fix
 */
export function createEntityIssue(
  container: ProjectDefinitionContainer,
  entityId: string,
  relativePath: ReferencePath,
  issue: Pick<DefinitionIssue, 'message' | 'severity' | 'fix'>,
): EntityDefinitionIssue {
  const entity = container.entityFromId(entityId);
  if (!entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }
  return { ...issue, entityId, path: relativePath };
}

/**
 * Creates a definition setter function from an issue's fix.
 *
 * Handles both fix variants:
 * - `applySetter`: returned directly (definition-level fixes)
 * - `apply`: wrapped in a setter that resolves the issue path and applies the
 *   local-value transform (field-level fixes)
 *
 * Returns `undefined` if the issue has no fix.
 */
export function createIssueFixSetter(
  issue: DefinitionIssue,
  container: ProjectDefinitionContainer,
): ((draft: ProjectDefinition) => void) | undefined {
  const { fix } = issue;
  if (!fix) return undefined;

  if (fix.applySetter) {
    return fix.applySetter;
  }

  if (fix.apply) {
    const applyFn = fix.apply;
    return (draft) => {
      const absolutePath = resolveIssuePath(issue, container);
      const currentValue: unknown = get(draft, absolutePath);
      set(draft, absolutePath, applyFn(currentValue));
    };
  }

  return undefined;
}
