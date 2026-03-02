import type { z } from 'zod';

import { isEqual } from 'es-toolkit';
import { capitalize } from 'es-toolkit/compat';

import type { EntitySchemaMeta } from '#src/references/definition-ref-registry.js';
import type {
  PartialProjectDefinitionInput,
  ProjectDefinition,
} from '#src/schema/index.js';

import { serializeSchema } from '#src/references/serialize-schema.js';

import { mergeDefinition } from './merge-definition.js';
import { collectEntityArrays } from './walk-schema.js';

type PlainObject = Record<string, unknown>;

/**
 * A single diff entry representing a changed entity or section.
 */
export interface DefinitionDiffEntry {
  /** Top-level key in the definition (e.g., "models", "settings") */
  path: string;
  /**
   * Human-readable label for this entry.
   *
   * Entity arrays: `"Model: User"`, `"App: backend"`
   * Other fields: `"Settings"`, `"Features"`
   */
  label: string;
  /** Type of change */
  type: 'added' | 'updated' | 'removed';
  /** The current serialized value (undefined for additions) */
  current: unknown;
  /** The merged serialized value (undefined for removals) */
  merged: unknown;
}

/**
 * Result of diffing a project definition against a partial merge.
 */
export interface DefinitionDiff {
  /** Whether there are any changes */
  hasChanges: boolean;
  /** Individual diff entries grouped by entity/section */
  entries: DefinitionDiffEntry[];
}

// ---------------------------------------------------------------------------
// Entity array diffing
// ---------------------------------------------------------------------------

/**
 * Diffs an entity array by the `name` field, scoped to only the entities
 * named in the partial definition.
 *
 * Entities not mentioned in the partial are ignored — this prevents showing
 * "removed" entries for entities that the partial doesn't care about.
 */
function diffEntityArray(
  path: string,
  entityMeta: EntitySchemaMeta,
  currentArray: PlainObject[],
  mergedArray: PlainObject[],
  partialNames: Set<string>,
): DefinitionDiffEntry[] {
  const entries: DefinitionDiffEntry[] = [];
  const label = capitalize(entityMeta.type.name);

  const currentByName = new Map(
    currentArray.map((item) => [item.name as string, item]),
  );
  const mergedByName = new Map(
    mergedArray.map((item) => [item.name as string, item]),
  );

  // Only diff entities named in the partial definition
  for (const name of partialNames) {
    const currentItem = currentByName.get(name);
    const mergedItem = mergedByName.get(name);

    if (!currentItem && mergedItem) {
      entries.push({
        path,
        label: `${label}: ${name}`,
        type: 'added',
        current: undefined,
        merged: mergedItem,
      });
    } else if (currentItem && !mergedItem) {
      entries.push({
        path,
        label: `${label}: ${name}`,
        type: 'removed',
        current: currentItem,
        merged: undefined,
      });
    } else if (currentItem && mergedItem && !isEqual(currentItem, mergedItem)) {
      entries.push({
        path,
        label: `${label}: ${name}`,
        type: 'updated',
        current: currentItem,
        merged: mergedItem,
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Main diff function
// ---------------------------------------------------------------------------

/**
 * Computes a structured, entity-grouped diff between the current project definition
 * and the result of merging a partial definition into it.
 *
 * For top-level entity arrays (models, apps, enums, libraries, features), produces
 * one entry per entity that was added, updated, or removed — detected via schema
 * entity metadata (`withEnt` annotations) using `collectEntityArrays`. For other
 * top-level fields (settings, plugins, etc.), produces one entry per changed field.
 *
 * @param schema - The project definition Zod schema
 * @param definition - The current parsed project definition (with IDs)
 * @param partialDef - A partial serialized definition to merge in
 * @returns A structured diff with entity-level entries
 */
export function diffDefinition(
  schema: z.ZodType,
  definition: ProjectDefinition,
  partialDef: PartialProjectDefinitionInput,
): DefinitionDiff {
  const serializedDef = serializeSchema(schema, definition) as PlainObject;
  const mergedDef = mergeDefinition(
    schema,
    definition,
    partialDef,
  ) as PlainObject;

  // Collect top-level entity arrays (path has no dots — single key like "models")
  const entityArrayInfoByKey = new Map(
    collectEntityArrays(schema)
      .filter((info) => !info.path.includes('.'))
      .map((info) => [info.path, info]),
  );

  const entries: DefinitionDiffEntry[] = [];
  const partialObj = partialDef as PlainObject;

  // Only diff keys present in the partial definition
  for (const key of Object.keys(partialObj)) {
    const currentValue = serializedDef[key];
    const mergedValue = mergedDef[key];

    if (isEqual(currentValue, mergedValue)) {
      continue;
    }

    const entityInfo = entityArrayInfoByKey.get(key);
    if (entityInfo) {
      const currentArray = (
        Array.isArray(currentValue) ? currentValue : []
      ) as PlainObject[];
      const mergedArray = (
        Array.isArray(mergedValue) ? mergedValue : []
      ) as PlainObject[];

      // Collect entity names from the partial definition to scope the diff
      const partialArray = (
        Array.isArray(partialObj[key]) ? partialObj[key] : []
      ) as PlainObject[];
      const partialNames = new Set(
        partialArray.map((item) => item.name as string),
      );

      entries.push(
        ...diffEntityArray(
          key,
          entityInfo.entityMeta,
          currentArray,
          mergedArray,
          partialNames,
        ),
      );
    } else {
      // Non-entity field: single entry
      const label = capitalize(key);
      if (currentValue === undefined) {
        entries.push({
          path: key,
          label,
          type: 'added',
          current: undefined,
          merged: mergedValue,
        });
      } else if (mergedValue === undefined) {
        entries.push({
          path: key,
          label,
          type: 'removed',
          current: currentValue,
          merged: undefined,
        });
      } else {
        entries.push({
          path: key,
          label,
          type: 'updated',
          current: currentValue,
          merged: mergedValue,
        });
      }
    }
  }

  return {
    hasChanges: entries.length > 0,
    entries,
  };
}
