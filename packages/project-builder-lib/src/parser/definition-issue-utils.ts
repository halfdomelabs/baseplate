import { get, set } from 'es-toolkit/compat';
import { produce } from 'immer';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { ReferencePath } from '#src/references/types.js';
import type { DefinitionIssueChecker } from '#src/schema/creator/definition-issue-checker-spec.js';
import type {
  DefinitionIssue,
  EntityDefinitionIssue,
} from '#src/schema/creator/definition-issue-types.js';
import type {
  PartialProjectDefinitionInput,
  ProjectDefinition,
} from '#src/schema/project-definition.js';
import type { DefinitionDiff } from '#src/tools/merge-schema/diff-definition.js';

import { PluginUtils } from '#src/definition/plugins/plugin-utils.js';
import { serializeSchema } from '#src/references/serialize-schema.js';
import { pluginEntityType } from '#src/schema/plugins/entity-types.js';
import {
  diffDefinition,
  diffSerializedDefinitions,
} from '#src/tools/merge-schema/diff-definition.js';
import { applyMergedDefinition } from '#src/tools/merge-schema/merge-definition.js';

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

/**
 * Creates a definition-level issue checker that warns when a plugin's required
 * models are out of sync with what the plugin expects.
 *
 * The `buildPartialDef` callback receives the container and should return the
 * expected partial definition, or `undefined` to skip the check (e.g. when a
 * required feature ref is missing or dangling).
 *
 * The helper handles the common pattern of:
 * 1. Guarding against a missing plugin config
 * 2. Diffing the current definition against the expected partial definition
 * 3. Returning a fixable warning if there are changes
 */
export function createPluginModelSyncChecker(options: {
  pluginKey: string;
  pluginLabel: string;
  buildPartialDef: (
    container: ProjectDefinitionContainer,
  ) => PartialProjectDefinitionInput | undefined;
}): DefinitionIssueChecker {
  return (container) => {
    const pluginConfig = PluginUtils.configByKey(
      container.definition,
      options.pluginKey,
    );
    if (!pluginConfig) return [];

    const partialDef = options.buildPartialDef(container);
    if (!partialDef) return [];

    const diff = diffDefinition(
      container.schema,
      container.definition,
      partialDef,
    );
    if (!diff.hasChanges) return [];

    const changedLabels = diff.entries.map((e) => e.label).join(', ');

    return [
      createEntityIssue(
        container,
        pluginEntityType.idFromKey(options.pluginKey),
        [],
        {
          message: `${options.pluginLabel} plugin models are out of sync: ${changedLabels}. Save the ${options.pluginLabel} plugin settings to update.`,
          severity: 'warning',
          fix: {
            label: `Sync ${options.pluginLabel} models`,
            applySetter: applyMergedDefinition(container, partialDef),
          },
        },
      ),
    ];
  };
}

/**
 * Previews the diff that would result from applying an issue's fix.
 *
 * Applies the fix to a draft copy of the definition, serializes both versions,
 * and returns a structured diff. Returns `undefined` if the issue has no fix.
 */
export function previewIssueFix(
  issue: DefinitionIssue,
  container: ProjectDefinitionContainer,
): DefinitionDiff | undefined {
  const setter = createIssueFixSetter(issue, container);
  if (!setter) return undefined;

  const { schema, definition } = container;
  const fixedDefinition = produce(definition, setter);

  const currentSerialized = serializeSchema(schema, definition);
  const fixedSerialized = serializeSchema(schema, fixedDefinition);

  return diffSerializedDefinitions(
    schema,
    currentSerialized as Record<string, unknown>,
    fixedSerialized as Record<string, unknown>,
  );
}
