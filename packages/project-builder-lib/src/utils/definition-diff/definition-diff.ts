/**
 * Allows diffing of arbitrary JSON objects.
 */

import type { Get, Paths } from 'type-fest';

import { cloneDeep, mapValues, omit, toMerged } from 'es-toolkit';
import { get, isMatch, set } from 'es-toolkit/compat';

export interface DefinitionDiffOperation<T = unknown> {
  type: 'add' | 'update' | 'remove';
  key: string;
  item: T;
}

abstract class DefinitionDiffField<T = unknown> {
  constructor(
    /**
     * The name of the field to be presented to the user.
     */
    public readonly name: string,
  ) {}

  abstract diff(current: T, desired: T): DefinitionDiffOperation[];

  abstract apply(current: T, diff: DefinitionDiffOperation[]): T;
}

interface DefinitionDiffKeyedArrayFieldOptions {
  /**
   * Whether to allow removing items from the array.
   */
  allowRemove?: boolean;
  /**
   * Ignore fields that should be ignored when diffing. Defaults to `['id']`.
   */
  ignoreFields?: readonly string[];
}

/**
 * A field that is an array of objects with a unique key.
 */
export class DefinitionDiffKeyedArrayField<
  T extends Record<string, unknown>[],
> extends DefinitionDiffField<T> {
  constructor(
    name: string,
    public readonly getKey: (item: T[number]) => string,
    public readonly options: DefinitionDiffKeyedArrayFieldOptions = {},
  ) {
    super(name);
    this.getKey = getKey;
  }

  diff(
    current: T | undefined,
    desired: T | undefined,
  ): DefinitionDiffOperation[] {
    const currentValue = current ?? [];
    const desiredValue = desired ?? [];
    if (!Array.isArray(currentValue) || !Array.isArray(desiredValue)) {
      throw new TypeError('Current and desired must be arrays');
    }
    const ops: DefinitionDiffOperation[] = [];
    const { allowRemove, ignoreFields = ['id'] } = this.options;
    const currentByKey = new Map(
      currentValue.map((item) => [this.getKey(item), item]),
    );
    const desiredByKey = new Map(
      desiredValue.map((item) => [this.getKey(item), item]),
    );

    for (const [key, desiredItem] of desiredByKey) {
      const currentItem = currentByKey.get(key);
      if (!currentItem) {
        ops.push({ type: 'add', key, item: desiredItem });
        continue;
      }
      if (
        !isMatch(
          omit(currentItem, ignoreFields),
          omit(desiredItem, ignoreFields),
        )
      ) {
        ops.push({ type: 'update', key, item: desiredItem });
      }
    }

    if (allowRemove) {
      for (const [key, currentItem] of currentByKey) {
        if (!desiredByKey.has(key)) {
          ops.push({ type: 'remove', key, item: currentItem });
        }
      }
    }

    return ops;
  }

  apply(current: T | undefined, diff: DefinitionDiffOperation[]): T {
    const patch = diff as DefinitionDiffOperation<T[number]>[];
    const currentValue = current ?? ([] as Record<string, unknown>[]);

    if (!Array.isArray(currentValue)) {
      throw new TypeError('Current must be array');
    }

    const items = [...currentValue];
    for (const { type, key, item } of patch) {
      const index = items.findIndex((i) => this.getKey(i) === key);
      switch (type) {
        case 'add': {
          items.push(item);
          break;
        }
        case 'update': {
          if (index === -1) {
            throw new Error(
              `Cannot apply patch. Item with key "${key}" not found.`,
            );
          }
          // Preserve existing id if present.
          items[index] = toMerged(items[index], item);
          break;
        }
        case 'remove': {
          if (index !== -1) {
            items.splice(index, 1);
          }
          break;
        }
      }
    }
    return items as T;
  }
}

/**
 * A field that is a replacement for the entire object or array.
 */
export class DefinitionDiffReplacementField<
  T = unknown,
> extends DefinitionDiffField<T> {
  diff(current: T, desired: T): DefinitionDiffOperation[] {
    if (!isMatch(current, desired)) {
      return [{ type: 'update', key: '*', item: desired }];
    }
    return [];
  }

  apply(current: T, diff: DefinitionDiffOperation[]): T {
    if (diff.length === 0) return current;
    return diff[0].item as T;
  }
}

type ConvertToTemplateString<T> = T extends number ? `${T}` : T;

export type DefinitionDiffConfig<T> = Partial<{
  [K in Paths<T, { maxRecursionDepth: 2 }>]: DefinitionDiffField<
    Exclude<Get<T, ConvertToTemplateString<K>>, undefined>
  >;
}>;

export type DefinitionDiffOutput<
  TConfiguration extends DefinitionDiffConfig<unknown>,
> = Partial<Record<keyof TConfiguration, DefinitionDiffOperation[]>>;

export function createDefinitionDiffConfig<TValue>(
  config: DefinitionDiffConfig<TValue>,
): DefinitionDiffConfig<TValue> {
  return config;
}

type InferDefinitionDiffInputFromConfig<
  TConfig extends DefinitionDiffConfig<unknown>,
> = TConfig extends DefinitionDiffConfig<infer T> ? T : never;

/**
 * Creates a diff between two objects.
 */
export function createDefinitionDiff<
  TConfig extends DefinitionDiffConfig<unknown>,
>(
  current: InferDefinitionDiffInputFromConfig<TConfig>,
  desired: InferDefinitionDiffInputFromConfig<TConfig>,
  configuration: TConfig,
): DefinitionDiffOutput<TConfig> | undefined {
  const ops = mapValues(configuration, (field, key) => {
    if (!field) return [];
    return (field as unknown as DefinitionDiffField).diff(
      get(current, key) as never,
      get(desired, key) as never,
    );
  });

  if (
    Object.values<DefinitionDiffOperation[]>(ops).every(
      (ops) => ops.length === 0,
    )
  ) {
    return undefined;
  }

  return ops;
}

/**
 * Applies a diff to an object.
 */
export function applyDefinitionDiff<
  TInput,
  TConfig extends DefinitionDiffConfig<unknown>,
>(
  current: TInput,
  diff: DefinitionDiffOutput<TConfig>,
  configuration: TConfig,
): TInput {
  const clonedCurrent = cloneDeep(current);

  for (const [key, ops] of Object.entries<
    DefinitionDiffOperation[] | undefined
  >(diff)) {
    if (!ops) continue;
    const field = configuration[
      key as keyof TConfig
    ] as unknown as DefinitionDiffField;
    const currentValue = get(clonedCurrent, key) as unknown;
    set(
      clonedCurrent as object,
      key,
      (field as unknown as DefinitionDiffField).apply(currentValue, ops),
    );
  }

  return clonedCurrent;
}
