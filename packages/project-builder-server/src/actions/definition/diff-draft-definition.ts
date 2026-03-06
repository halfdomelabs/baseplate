import type { z } from 'zod';

import {
  collectEntityArrays,
  getEntityName,
} from '@baseplate-dev/project-builder-lib';
import { isEqual } from 'es-toolkit';
import { capitalize } from 'es-toolkit/compat';

type PlainObject = Record<string, unknown>;

export interface DraftDiffEntry {
  /** Human-readable label (e.g., "Feature: payments", "Model: BlogPost") */
  label: string;
  /** Type of change */
  type: 'added' | 'updated' | 'removed';
}

export interface DraftDiffResult {
  /** Whether there are any changes */
  hasChanges: boolean;
  /** Individual diff entries */
  entries: DraftDiffEntry[];
}

/**
 * Compares a draft serialized definition against the current serialized definition,
 * producing entity-level diff entries (added/updated/removed).
 *
 * Both definitions should be in serialized form (with entity names, not IDs).
 */
export function diffDraftDefinition(
  schema: z.ZodType,
  currentDef: PlainObject,
  draftDef: PlainObject,
): DraftDiffResult {
  // Collect top-level entity arrays from the schema
  const entityArrayInfoByKey = new Map(
    collectEntityArrays(schema)
      .filter((info) => !info.path.includes('.'))
      .map((info) => [info.path, info]),
  );

  const entries: DraftDiffEntry[] = [];

  // Compare all keys in both definitions
  const allKeys = new Set([
    ...Object.keys(currentDef),
    ...Object.keys(draftDef),
  ]);

  for (const key of allKeys) {
    const currentValue = currentDef[key];
    const draftValue = draftDef[key];

    if (isEqual(currentValue, draftValue)) {
      continue;
    }

    const entityInfo = entityArrayInfoByKey.get(key);
    if (entityInfo) {
      const currentArray = (
        Array.isArray(currentValue) ? currentValue : []
      ) as PlainObject[];
      const draftArray = (
        Array.isArray(draftValue) ? draftValue : []
      ) as PlainObject[];

      const label = capitalize(entityInfo.entityMeta.type.name);

      const currentByName = new Map(
        currentArray.map((item) => [
          getEntityName(entityInfo.entityMeta, item),
          item,
        ]),
      );
      const draftByName = new Map(
        draftArray.map((item) => [
          getEntityName(entityInfo.entityMeta, item),
          item,
        ]),
      );

      // Check all names in both current and draft
      const allNames = new Set([
        ...currentByName.keys(),
        ...draftByName.keys(),
      ]);

      for (const name of allNames) {
        const currentItem = currentByName.get(name);
        const draftItem = draftByName.get(name);

        if (!currentItem && draftItem) {
          entries.push({ label: `${label}: ${name}`, type: 'added' });
        } else if (currentItem && !draftItem) {
          entries.push({ label: `${label}: ${name}`, type: 'removed' });
        } else if (
          currentItem &&
          draftItem &&
          !isEqual(currentItem, draftItem)
        ) {
          entries.push({ label: `${label}: ${name}`, type: 'updated' });
        }
      }
    } else {
      // Non-entity field changed
      const label = capitalize(key);
      if (currentValue === undefined) {
        entries.push({ label, type: 'added' });
      } else if (draftValue === undefined) {
        entries.push({ label, type: 'removed' });
      } else {
        entries.push({ label, type: 'updated' });
      }
    }
  }

  return {
    hasChanges: entries.length > 0,
    entries,
  };
}
