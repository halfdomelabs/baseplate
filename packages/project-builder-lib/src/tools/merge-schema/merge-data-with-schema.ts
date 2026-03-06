import type { PartialDeep } from 'type-fest';
import type { z } from 'zod';

import { toMerged } from 'es-toolkit';

import type { EntitySchemaMeta } from '#src/references/definition-ref-registry.js';

import { getSchemaChildren } from '#src/parser/schema-structure.js';

import { assignEntityIds } from '../assign-entity-ids.js';
import { getEntityMeta, getEntityName } from './entity-utils.js';
import { getMergeRule } from './merge-rule-registry.js';

type PlainObject = Record<string, unknown>;

/**
 * Merges two values according to the given Zod schema and any registered merge rules.
 *
 * Default behaviors:
 * - Leaf scalar → desired replaces current
 * - Object → merge fields recursively; `undefined` desired fields keep current value (partial patch)
 * - Array whose element has `withEnt` annotation → merge by entity name (add-only, order-preserving)
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
      const { elementSchema } = children;
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
      if (!children.match) {
        // No matching branch found for desired — replace
        return desired;
      }
      // If current matches a different branch, replace to avoid leaking stale fields
      const currentChildren = getSchemaChildren(schema, current, []);
      if (
        currentChildren.kind !== 'discriminated-union' ||
        currentChildren.match !== children.match
      ) {
        return desired;
      }
      return mergeDataWithSchemaInternal(children.match, current, desired);
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
 * Merges an array of entity objects by name (add-only, order-preserving).
 *
 * - Current items are kept in their original order
 * - Matched items (by name) are merged recursively via schema
 * - Current items not in desired are kept as-is
 * - New desired items are appended at the end with fresh generated IDs
 */
function mergeEntityArray(
  current: PlainObject[] | undefined,
  desired: PlainObject[],
  elementSchema: z.ZodType,
  entityMeta: EntitySchemaMeta,
): PlainObject[] {
  const currentItems = current ?? [];
  const desiredByName = new Map(
    desired.map((item) => [getEntityName(entityMeta, item), item]),
  );
  const seen = new Set<string>();
  const result: PlainObject[] = [];

  // Walk current items in order — merge matched, keep unmatched
  for (const currentItem of currentItems) {
    const name = getEntityName(entityMeta, currentItem);
    const desiredItem = desiredByName.get(name);
    if (desiredItem) {
      result.push(
        mergeDataWithSchemaInternal(
          elementSchema,
          currentItem,
          desiredItem,
        ) as PlainObject,
      );
      seen.add(name);
    } else {
      result.push(currentItem);
    }
  }

  // Append new desired items at the end, with fresh IDs
  for (const desiredItem of desired) {
    const name = getEntityName(entityMeta, desiredItem);
    if (!seen.has(name)) {
      const baseItem = assignEntityIds(elementSchema, desiredItem);
      result.push(
        mergeDataWithSchemaInternal(elementSchema, {}, baseItem) as PlainObject,
      );
      seen.add(name);
    }
  }

  return result;
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
  const desiredByKey = new Map(desired.map((item) => [getKey(item), item]));
  const seen = new Set<string>();

  const result: unknown[] = [];

  // Walk current items in order — merge matched, keep unmatched
  for (const currentItem of currentItems) {
    const key = getKey(currentItem);
    const desiredItem = desiredByKey.get(key);
    if (desiredItem) {
      result.push(
        toMerged(currentItem as PlainObject, desiredItem as PlainObject),
      );
      seen.add(key);
    } else {
      result.push(currentItem);
    }
  }

  // Append new desired items (not in current) at the end
  for (const desiredItem of desired) {
    const key = getKey(desiredItem);
    if (!seen.has(key)) {
      result.push(desiredItem);
      seen.add(key);
    }
  }

  return result;
}
