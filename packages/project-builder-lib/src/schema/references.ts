import * as R from 'ramda';
import { FieldValues } from '@src/types/path/eager.js';
import {
  FieldPath,
  FieldPathValue,
  GlobFieldPath,
  GlobFieldPathValue,
} from '@src/types/path/index.js';
import { notEmpty } from '@src/utils/array.js';

export const REFERENCEABLE_CATEGORIES = [
  'feature',
  'model',
  'modelField',
  'modelLocalRelation',
  'modelForeignRelation',
  'modelTransformer',
  'role',
  'storageAdapter',
  'storageCategory',
  'enum',
  'adminCrudEmbeddedForm',
] as const;

export interface ObjectReferenceableEntry {
  category: ReferenceableCategory;
  id: string;
  name: string;
  key: string;
}

export interface ObjectReferenceEntry {
  category: ReferenceableCategory;
  referenceType?: string;
  key: string;
  name: string;
  path: string;
}

export type ReferenceableCategory = (typeof REFERENCEABLE_CATEGORIES)[number];

export interface GetReferencesResult {
  referenceables: ObjectReferenceableEntry[];
  references: ObjectReferenceEntry[];
}

export type GetReferencesFunction<T> = (data: T) => GetReferencesResult;

function pathToParts(path: string): (string | number)[] {
  return path
    .split('.')
    .map((key) => (/^[0-9]+$/.test(key) ? parseInt(key, 10) : key));
}

export function walkGlobPathRecursive(
  object: unknown,
  callback: (object: unknown, path: string) => void,
  prefix: string,
  remainingPath: string
): void {
  if (object === null || object === undefined) {
    return;
  }

  if (!remainingPath) {
    callback(object, prefix);
    return;
  }

  const currentPart = remainingPath.split('.')[0];
  const newRemainingPath = remainingPath.substring(currentPart.length + 1);

  if (currentPart === '*') {
    if (!Array.isArray(object)) {
      throw new Error(
        `Did not find array when provided * in ${prefix} in ${prefix}.${remainingPath}`
      );
    }
    object.forEach((item, idx) =>
      walkGlobPathRecursive(
        item,
        callback,
        `${prefix ? `${prefix}.` : ''}${idx}`,
        newRemainingPath
      )
    );
  } else {
    if (typeof object !== 'object') {
      throw new Error(
        `Found non-object when expected object (${prefix} in ${prefix}.${remainingPath})`
      );
    }

    walkGlobPathRecursive(
      (object as Record<string, unknown>)[currentPart],
      callback,
      `${prefix ? `${prefix}.` : ''}${currentPart}`,
      newRemainingPath
    );
  }
}

export class ReferencesBuilder<T extends FieldValues> {
  private baseObject: T;

  private references: ObjectReferenceEntry[] = [];

  private referenceables: ObjectReferenceableEntry[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parentBuilder: ReferencesBuilder<any> | null;

  private prefix: string;

  public constructor(
    baseObject: T,
    prefix?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentBuilder: ReferencesBuilder<any> | null = null
  ) {
    this.baseObject = baseObject;
    this.prefix = prefix || '';
    this.parentBuilder = parentBuilder;
  }

  public withPrefix<Prefix extends FieldPath<T>>(
    prefix: Prefix
  ): ReferencesBuilder<Exclude<FieldPathValue<T, Prefix>, undefined>> {
    const newObject: FieldPathValue<T, Prefix> | undefined = R.path(
      pathToParts(prefix),
      this.baseObject
    );
    if (newObject === undefined) {
      throw new Error(`Could not find prefix ${prefix} in object`);
    }
    return new ReferencesBuilder(newObject, prefix, this);
  }

  public addReference<Path extends FieldPath<T>>(
    path: Path,
    reference: FieldPathValue<T, Path> extends string | undefined
      ? Omit<ObjectReferenceEntry, 'path' | 'key' | 'name'> & {
          key?: string;
          name?: string;
        }
      : never
  ): ReferencesBuilder<T> {
    const name = reference.name || R.path(pathToParts(path), this.baseObject);
    if (!name) {
      throw new Error(
        `Cannot find value of reference ${path} (${reference.category})`
      );
    }
    const fullPath = this.prefix ? `${this.prefix}.${path}` : path;
    const constructedReference = {
      ...reference,
      key: reference.key || name,
      name,
    };
    if (this.parentBuilder) {
      this.parentBuilder.addReference(fullPath, constructedReference);
    } else {
      this.references.push({ ...constructedReference, path: fullPath });
    }
    return this;
  }

  public addReferences<Path extends GlobFieldPath<T>>(
    path: Path,
    {
      generateKey,
      ...config
    }: GlobFieldPathValue<T, Path> extends string
      ? Omit<ObjectReferenceEntry, 'path' | 'key' | 'name'> & {
          generateKey?: (name: string) => string;
        }
      : never
  ): ReferencesBuilder<T> {
    walkGlobPathRecursive(
      this.baseObject,
      (name, fullPath) => {
        if (typeof name !== 'string') {
          throw new Error(
            `Found non-string when expected string (${fullPath})`
          );
        }
        const constructedReference = {
          ...config,
          key: generateKey ? generateKey(name) : name,
        };
        this.addReference(
          fullPath as FieldPath<T>,
          // tricky to hack in
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
          constructedReference as any
        );
      },
      '',
      path
    );
    return this;
  }

  public addReferenceable(
    referenceable: Omit<ObjectReferenceableEntry, 'key'> & { key?: string }
  ): ReferencesBuilder<T> {
    const constructedReferenceable = {
      ...referenceable,
      key: referenceable.key || referenceable.name,
    };
    if (this.parentBuilder) {
      this.parentBuilder.addReferenceable(constructedReferenceable);
    } else {
      this.referenceables.push(constructedReferenceable);
    }
    return this;
  }

  public build(): GetReferencesResult {
    return {
      referenceables: this.referenceables,
      references: this.references,
    };
  }
}

export interface FixReferenceRenamesOptions {
  whitelistReferences?: string[];
  ignoredReferences?: string[];
}

interface RenameEntry {
  key: string;
  from: string;
  to: string;
  category: string;
}

export function fixReferenceRenames<T>(
  oldConfig: T,
  newConfig: T,
  getReferences: GetReferencesFunction<T>,
  options?: FixReferenceRenamesOptions
): T {
  // run fix repeatedly until we have no more renames (allows renames of references to references)
  let previousConfig = oldConfig;
  let currentConfig = newConfig;

  const renameReferences = (
    config: T,
    references: ObjectReferenceEntry[],
    renameEntry: RenameEntry
  ): T => {
    // find references to rename
    const referencesToRename = references
      .filter(
        (r) => r.category === renameEntry.category && r.key === renameEntry.key
      )
      .filter(
        (r) =>
          !options?.ignoredReferences ||
          !r.referenceType ||
          !options?.ignoredReferences.includes(r.referenceType)
      )
      .filter(
        (r) =>
          !options?.whitelistReferences ||
          !r.referenceType ||
          options?.whitelistReferences.includes(r.referenceType)
      );

    return referencesToRename.reduce((priorConfig, entry) => {
      const lens = R.lensPath(pathToParts(entry.path));
      return R.set(lens, renameEntry.to, priorConfig) as T;
    }, config);
  };

  for (let i = 0; i < 100; i += 1) {
    const { referenceables: oldReferenceables } = getReferences(previousConfig);
    const { referenceables: newReferenceables, references: newReferences } =
      getReferences(currentConfig);

    const renamedReferenceables = newReferenceables
      .map((entry) => {
        const oldEntry = oldReferenceables.find(
          (e) => e.id === entry.id && e.category === entry.category
        );
        if (oldEntry && oldEntry.name !== entry.name) {
          return {
            key: oldEntry.key,
            from: oldEntry.name,
            to: entry.name,
            category: oldEntry.category,
          };
        }
        return null;
      })
      .filter(notEmpty);

    if (!renamedReferenceables.length) {
      return currentConfig;
    }

    previousConfig = currentConfig;
    currentConfig = renamedReferenceables.reduce(
      (priorConfig, renamedReferenceable) =>
        renameReferences(priorConfig, newReferences, renamedReferenceable),
      currentConfig
    );
  }

  throw new Error(`Exceeded max iterations for renaming references`);
}
