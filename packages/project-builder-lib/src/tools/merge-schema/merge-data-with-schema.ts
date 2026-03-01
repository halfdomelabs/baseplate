import type { PartialDeep } from 'type-fest';
import type { z, ZodArray } from 'zod';

import { cloneDeep, toMerged } from 'es-toolkit';
import { set } from 'es-toolkit/compat';

import type { EntitySchemaMeta } from '#src/references/definition-ref-registry.js';

import { getSchemaChildren } from '#src/parser/schema-structure.js';
import { definitionRefRegistry } from '#src/references/definition-ref-registry.js';

import { getMergeRule } from './merge-rule-registry.js';

type PlainObject = Record<string, unknown>;

/**
 * Returns the first EntitySchemaMeta found on the given schema or any inner
 * schema reachable through wrappers (optional/nullable/default).
 */
function getEntityMeta(schema: z.ZodType): EntitySchemaMeta | undefined {
  const meta = definitionRefRegistry
    .getAll(schema)
    .find((m): m is EntitySchemaMeta => m.kind === 'entity');
  if (meta) {
    return meta;
  }
  const children = getSchemaChildren(schema, undefined, []);
  if (children.kind === 'wrapper') {
    return getEntityMeta(children.innerSchema);
  }
  return undefined;
}

/**
 * Merges two values according to the given Zod schema and any registered merge rules.
 *
 * Default behaviors:
 * - Leaf scalar → desired replaces current
 * - Object → merge fields recursively; `undefined` desired fields keep current value (partial patch)
 * - Array whose element has `withEnt` annotation → merge by entity `name` field (add/update/remove)
 * - Any other array → full replace with desired
 * - Wrapper (optional/nullable/default) → descend to inner schema
 * - Discriminated union → find matching branch by discriminator, merge
 *
 * Explicit rules from `withMergeRule` override the defaults:
 * - `replace` → always return desired value
 * - `by-key` → merge array by a custom key function (add-only)
 */
export function mergeDataWithSchema<T extends z.ZodType>(
  schema: T,
  current: z.input<T>,
  desired: PartialDeep<z.input<T>, { recurseIntoArrays: true }>,
): z.input<T> {
  return mergeDataWithSchemaInternal(schema, current, desired) as z.input<T>;
}

/**
 * Internal untyped implementation of the schema-driven merge walker.
 */
function mergeDataWithSchemaInternal(
  schema: z.ZodType,
  current: unknown,
  desired: unknown,
): unknown {
  // If desired is undefined, always keep current (partial patch semantics)
  if (desired === undefined) {
    return current;
  }

  // Check for explicit merge rule registered via withMergeRule
  const rule = getMergeRule(schema);
  if (rule) {
    switch (rule.kind) {
      case 'replace': {
        return desired;
      }
      case 'by-key': {
        return mergeByKey(
          current as unknown[] | undefined,
          desired as unknown[],
          rule.getKey,
        );
      }
    }
  }

  const children = getSchemaChildren(schema, desired, []);

  switch (children.kind) {
    case 'leaf':
    case 'leaf-union': {
      return desired;
    }

    case 'wrapper': {
      return mergeDataWithSchemaInternal(
        children.innerSchema,
        current,
        desired,
      );
    }

    case 'object': {
      const currentObj = (current ?? {}) as PlainObject;
      const desiredObj = desired as PlainObject;
      const merged: PlainObject = { ...currentObj };
      for (const [key, fieldSchema] of children.entries) {
        const desiredValue = desiredObj[key];
        if (desiredValue === undefined) {
          // Keep current value — partial patch semantics
          continue;
        }
        merged[key] = mergeDataWithSchemaInternal(
          fieldSchema,
          currentObj[key],
          desiredValue,
        );
      }
      return merged;
    }

    case 'array': {
      const typed = schema as unknown as ZodArray;
      const elementSchema = typed._zod.def.element as z.ZodType;
      const entityMeta = getEntityMeta(elementSchema);

      // Auto-detect entity arrays: merge by `name` field
      if (entityMeta) {
        return mergeEntityArray(
          current as PlainObject[] | undefined,
          desired as PlainObject[],
          elementSchema,
          entityMeta,
        );
      }

      // Default: full replace
      return desired;
    }

    case 'discriminated-union': {
      if (children.match) {
        return mergeDataWithSchemaInternal(children.match, current, desired);
      }
      // No matching branch found — replace
      return desired;
    }

    case 'tuple':
    case 'record':
    case 'intersection': {
      // For these structural types, default to full replace
      return desired;
    }
  }
}

/**
 * Merges an array of entity objects by the `name` field.
 *
 * - Entities in `desired` that exist in `current` (by name) are merged recursively
 * - Entities in `desired` not in `current` are appended with a fresh generated ID
 * - Entities in `current` not in `desired` are removed (full desired-list semantics)
 */
function mergeEntityArray(
  current: PlainObject[] | undefined,
  desired: PlainObject[],
  elementSchema: z.ZodType,
  entityMeta: EntitySchemaMeta,
): PlainObject[] {
  const currentItems = current ?? [];
  const currentByName = new Map(
    currentItems.map((item) => [item.name as string, item]),
  );

  return desired.map((desiredItem) => {
    const name = desiredItem.name as string;
    const currentItem = currentByName.get(name);

    // For new entities, build a skeleton current with a fresh ID so that
    // recursive mergeDataWithSchema generates IDs for all nested entity arrays too.
    const baseItem =
      currentItem ??
      set(
        cloneDeep(desiredItem),
        entityMeta.idPath,
        entityMeta.type.generateNewId(),
      );

    return mergeDataWithSchemaInternal(
      elementSchema,
      currentItem ? currentItem : {},
      // For new entities, inject the generated ID into desired before merging
      currentItem ? desiredItem : baseItem,
    ) as PlainObject;
  });
}

/**
 * Merges an array by a custom key function (add-only).
 *
 * - Items in `desired` that match a `current` item (by key) are merged with `toMerged`
 * - Items in `desired` not in `current` are appended
 * - Items in `current` not in `desired` are kept (add-only semantics)
 */
function mergeByKey(
  current: unknown[] | undefined,
  desired: unknown[],
  getKey: (item: unknown) => string,
): unknown[] {
  const currentItems = current ?? [];
  const currentByKey = new Map(
    currentItems.map((item) => [getKey(item), item]),
  );
  const desiredByKey = new Map(desired.map((item) => [getKey(item), item]));

  const result: unknown[] = [];

  // Keep current items not in desired
  for (const [key, item] of currentByKey) {
    if (!desiredByKey.has(key)) {
      result.push(item);
    }
  }

  // Add/update from desired
  for (const desiredItem of desired) {
    const key = getKey(desiredItem);
    const currentItem = currentByKey.get(key);
    if (currentItem) {
      result.push(
        toMerged(currentItem as PlainObject, desiredItem as PlainObject),
      );
    } else {
      result.push(desiredItem);
    }
  }

  return result;
}
