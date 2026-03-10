import type { z } from 'zod';

import { isEqual } from 'es-toolkit';
import { capitalize } from 'es-toolkit/compat';

import type { EntitySchemaMeta } from '#src/references/definition-ref-registry.js';
import type {
  PartialProjectDefinitionInput,
  ProjectDefinition,
} from '#src/schema/index.js';

import { serializeSchema } from '#src/references/serialize-schema.js';

import { getEntityName } from './entity-utils.js';
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
 * Diffs an entity array by the `name` field.
 *
 * When `scopeToNames` is provided, only those entities are compared — this prevents
 * showing "removed" entries for entities that the partial doesn't care about.
 * When omitted, all entities in both arrays are compared.
 */
function diffEntityArray(
  path: string,
  entityMeta: EntitySchemaMeta,
  currentArray: PlainObject[],
  otherArray: PlainObject[],
  scopeToNames?: Set<string>,
): DefinitionDiffEntry[] {
  const entries: DefinitionDiffEntry[] = [];
  const label = capitalize(entityMeta.type.name);

  const currentByName = new Map(
    currentArray.map((item) => [getEntityName(entityMeta, item), item]),
  );
  const otherByName = new Map(
    otherArray.map((item) => [getEntityName(entityMeta, item), item]),
  );

  const namesToDiff =
    scopeToNames ?? new Set([...currentByName.keys(), ...otherByName.keys()]);

  for (const name of namesToDiff) {
    const currentItem = currentByName.get(name);
    const otherItem = otherByName.get(name);

    if (!currentItem && otherItem) {
      entries.push({
        path,
        label: `${label}: ${name}`,
        type: 'added',
        current: undefined,
        merged: otherItem,
      });
    } else if (currentItem && !otherItem) {
      entries.push({
        path,
        label: `${label}: ${name}`,
        type: 'removed',
        current: currentItem,
        merged: undefined,
      });
    } else if (currentItem && otherItem && !isEqual(currentItem, otherItem)) {
      entries.push({
        path,
        label: `${label}: ${name}`,
        type: 'updated',
        current: currentItem,
        merged: otherItem,
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Core diffing of two serialized definitions
// ---------------------------------------------------------------------------

export interface DiffSerializedDefinitionsOptions {
  /**
   * When provided, only these top-level keys are compared.
   * When omitted, all keys from both definitions are compared.
   */
  scopeToKeys?: Set<string>;

  /**
   * When provided, entity array diffs are scoped to only these entity names
   * per top-level key. When omitted, all entities in both arrays are compared.
   */
  entityNamesByKey?: Map<string, Set<string>>;
}

/**
 * Compares two serialized project definitions at the entity level, producing
 * diff entries for added, updated, and removed entities/fields.
 *
 * Both definitions should be in serialized form (with entity names, not IDs).
 *
 * @param schema - The project definition Zod schema
 * @param currentDef - The current serialized definition
 * @param otherDef - The other serialized definition to compare against
 * @param options - Optional scoping options
 * @returns Entity-level diff entries
 */
export function diffSerializedDefinitions(
  schema: z.ZodType,
  currentDef: PlainObject,
  otherDef: PlainObject,
  options?: DiffSerializedDefinitionsOptions,
): DefinitionDiff {
  const entityArrayInfoByKey = new Map(
    collectEntityArrays(schema)
      .filter((info) => !info.path.includes('.'))
      .map((info) => [info.path, info]),
  );

  const entries: DefinitionDiffEntry[] = [];

  const keysToCompare =
    options?.scopeToKeys ??
    new Set([...Object.keys(currentDef), ...Object.keys(otherDef)]);

  for (const key of keysToCompare) {
    const currentValue = currentDef[key];
    const otherValue = otherDef[key];

    if (isEqual(currentValue, otherValue)) {
      continue;
    }

    const entityInfo = entityArrayInfoByKey.get(key);
    if (entityInfo) {
      const currentArray = (
        Array.isArray(currentValue) ? currentValue : []
      ) as PlainObject[];
      const otherArray = (
        Array.isArray(otherValue) ? otherValue : []
      ) as PlainObject[];

      const scopeToNames = options?.entityNamesByKey?.get(key);

      entries.push(
        ...diffEntityArray(
          key,
          entityInfo.entityMeta,
          currentArray,
          otherArray,
          scopeToNames,
        ),
      );
    } else {
      const label = capitalize(key);
      if (currentValue === undefined) {
        entries.push({
          path: key,
          label,
          type: 'added',
          current: undefined,
          merged: otherValue,
        });
      } else if (otherValue === undefined) {
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
          merged: otherValue,
        });
      }
    }
  }

  return {
    hasChanges: entries.length > 0,
    entries,
  };
}

// ---------------------------------------------------------------------------
// High-level diff with merge
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

  const partialObj = partialDef as PlainObject;
  const scopeToKeys = new Set(Object.keys(partialObj));

  // Build entity name scopes from the partial definition
  const entityArrayInfoByKey = new Map(
    collectEntityArrays(schema)
      .filter((info) => !info.path.includes('.'))
      .map((info) => [info.path, info]),
  );

  const entityNamesByKey = new Map<string, Set<string>>();
  for (const key of scopeToKeys) {
    const entityInfo = entityArrayInfoByKey.get(key);
    if (entityInfo) {
      const partialArray = (
        Array.isArray(partialObj[key]) ? partialObj[key] : []
      ) as PlainObject[];
      entityNamesByKey.set(
        key,
        new Set(
          partialArray.map((item) =>
            getEntityName(entityInfo.entityMeta, item),
          ),
        ),
      );
    }
  }

  return diffSerializedDefinitions(schema, serializedDef, mergedDef, {
    scopeToKeys,
    entityNamesByKey,
  });
}
