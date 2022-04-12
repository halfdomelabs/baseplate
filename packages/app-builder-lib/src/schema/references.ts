import R from 'ramda';
import { notEmpty } from '@src/utils/array';

export interface ObjectReference {
  category: string;
  name?: string;
  path: string;
  mapToKey?(name: string, parents: unknown[], object: unknown): string;
}

export interface ObjectReferenceable {
  category: string;
  path: string;
  nameProperty: string;
  idProperty?: string;
  mapToKey?(name: string, parents: unknown[], object: unknown): string;
}

export interface ObjectReferenceEntry {
  key: string;
  name: string;
  path: string;
  referenceName?: string;
}

export interface ObjectReferenceableEntry {
  id: string;
  name: string;
  key: string;
  path: string;
}

export function walkObjectRecursive<T>(
  object: unknown,
  getValues: (object: unknown, path: string, parents: unknown[]) => T[],
  prefix: string,
  remainingPath: string,
  parents: unknown[] = []
): T[] {
  if (object === null || object === undefined) {
    return [];
  }

  if (!remainingPath) {
    return getValues(object, prefix, parents);
  }

  const currentPart = remainingPath.split('.')[0];
  const newRemainingPath = remainingPath.substring(currentPart.length + 1);
  const newParents = [object, ...parents];

  if (Array.isArray(object)) {
    if (currentPart !== '*') {
      throw new Error(
        `Found array when not provided * in ${prefix} in ${prefix}.${remainingPath}`
      );
    }
    return object.flatMap((item, idx) =>
      walkObjectRecursive(
        item,
        getValues,
        `${prefix ? `${prefix}.` : ''}${idx}`,
        newRemainingPath,
        newParents
      )
    );
  }

  if (typeof object !== 'object') {
    throw new Error(
      `Found non-object when expected object (${prefix} in ${prefix}.${remainingPath})`
    );
  }

  return walkObjectRecursive(
    (object as Record<string, unknown>)[currentPart],
    getValues,
    `${prefix ? `${prefix}.` : ''}${currentPart}`,
    newRemainingPath,
    newParents
  );
}

export function findReferencableEntries(
  object: unknown,
  reference: ObjectReferenceable
): ObjectReferenceableEntry[] {
  return walkObjectRecursive(
    object,
    (foundObject, path, parents) => {
      const objectDict = foundObject as Record<string, string>;
      const name = objectDict[reference.nameProperty];

      if (typeof name !== 'string') {
        throw new Error(
          `Name of reference at ${path} must be a string, but got ${typeof name}`
        );
      }

      const id = objectDict[reference.idProperty || reference.nameProperty];

      if (typeof id !== 'string') {
        throw new Error(
          `ID of reference at ${path} must be a string, but got ${typeof id}`
        );
      }

      return [
        {
          id: objectDict[reference.idProperty || reference.nameProperty],
          name,
          key: reference.mapToKey
            ? reference.mapToKey(name, [foundObject, ...parents], object)
            : name,
          path,
        },
      ];
    },
    '',
    reference.path
  );
}

export function findReferenceEntries(
  object: unknown,
  reference: ObjectReference
): ObjectReferenceEntry[] {
  return walkObjectRecursive(
    object,
    (foundObject, path, parents) => {
      if (typeof foundObject !== 'string') {
        throw new Error(
          `Name of reference at ${path} must be a string, but got ${typeof foundObject}`
        );
      }

      return [
        {
          name: foundObject,
          key: reference.mapToKey
            ? reference.mapToKey(foundObject, parents, object)
            : foundObject,
          path,
          referenceName: reference.name,
        },
      ];
    },
    '',
    reference.path
  );
}

export interface FixReferenceRenamesOptions {
  ignoredReferences?: string[];
}

export function fixReferenceRenames<T>(
  oldConfig: T,
  newConfig: T,
  referencables: ObjectReferenceable[],
  references: ObjectReference[],
  options?: FixReferenceRenamesOptions
): T {
  const renamedEntriesByCategory = R.zipObj(
    referencables.map((r) => r.category),
    referencables.map((referenceable) => {
      const oldEntries = findReferencableEntries(oldConfig, referenceable);
      const newEntries = findReferencableEntries(newConfig, referenceable);

      return newEntries
        .map((entry) => {
          const oldEntry = oldEntries.find((e) => e.id === entry.id);
          if (oldEntry && oldEntry.name !== entry.name) {
            return {
              key: oldEntry.key,
              from: oldEntry.name,
              to: entry.name,
            };
          }
          return null;
        })
        .filter(notEmpty);
    })
  );

  return Object.keys(renamedEntriesByCategory).reduce(
    (categoryObject, category) => {
      const renamedEntriesForCategory = renamedEntriesByCategory[category];
      // find references to category
      const referencesForCategory = references.filter(
        (r) => r.category === category
      );
      const referenceEntries = referencesForCategory
        .flatMap((reference) => findReferenceEntries(newConfig, reference))
        .filter(
          (r) =>
            !options?.ignoredReferences ||
            !r.referenceName ||
            !options?.ignoredReferences.includes(r.referenceName)
        );
      return referenceEntries.reduce((referenceObject, entry) => {
        const renamedTo = renamedEntriesForCategory.find(
          (r) => r.key === entry.key
        )?.to;
        if (!renamedTo) {
          return referenceObject;
        }

        const lens = R.lensPath(
          entry.path
            .split('.')
            .map((key) => (/^[0-9]+$/.test(key) ? parseInt(key, 10) : key))
        );
        return R.set(lens, renamedTo, referenceObject) as T;
      }, categoryObject);
    },
    newConfig
  );
}
