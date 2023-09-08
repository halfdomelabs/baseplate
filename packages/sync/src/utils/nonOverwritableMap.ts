/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as R from 'ramda';

type ArrayKeys<T> = {
  [K in keyof T]: T[K] extends Array<unknown> ? K : never;
}[keyof T];

export interface NonOverwriteableMap<T extends object> {
  /**
   * Set a value in the map
   *
   * @param key Key of value in map
   * @param value Value to set
   */
  set<Key extends keyof T>(key: Key, value: T[Key]): this;
  /**
   * Appends a value to an array in the map
   *
   * @param key Key of value in map
   * @param value Array of values to append
   */
  append<Key extends ArrayKeys<T>>(
    key: Key,
    value: T[Key] extends Array<infer U> ? U : never
  ): this;
  /**
   * Appends an array of values to an array uniquely in the map
   *
   * @param key Key of value in map
   * @param value Array of values to append
   */
  appendUnique<Key extends ArrayKeys<T>>(
    key: Key,
    value: T[Key] | (T[Key] extends Array<infer U> ? U : never)
  ): this;
  /**
   * Gets a value from the map
   *
   * @param key The key of the value to get
   */
  get<K extends keyof T>(key: K): T[K] | undefined;
  /**
   * Merges an object into the map, setting each one of the values in the object
   *
   * @param value Partial map of data to merge in
   */
  merge(value: Partial<T>): this;
  /**
   * The fully constructed map
   */
  value(): T;
}

interface NonOverwriteableMapConfig {
  /**
   * Keys that contain arrays will be merged together uniquely with defaults
   */
  mergeArraysUniquely?: boolean;
  /**
   * The name of the map to display in errors
   */
  name?: string;
  /**
   * Whether the defaults can be overriden or not
   */
  defaultsOverwriteable?: boolean;
}

/**
 * Creates map that has an initial default, but whose keys cannot be overwritten
 * once written.
 */
export function createNonOverwriteableMap<T extends object>(
  defaults: T,
  options: NonOverwriteableMapConfig = {}
): NonOverwriteableMap<T> {
  const {
    name = 'non-overwriteable map',
    mergeArraysUniquely,
    defaultsOverwriteable,
  } = options;

  let overrideValues: Partial<T> = defaultsOverwriteable ? {} : defaults;

  const nonOverwriteableMerge = R.mergeWithKey((key) => {
    throw new Error(`Field ${key} already has value in ${name}`);
  });

  // performs the final merge of overrideValues and defaults
  const finalMerge = R.mergeWithKey((key, a, b) => {
    if (mergeArraysUniquely && Array.isArray(a) && Array.isArray(b)) {
      return R.uniq(a.concat(b));
    }
    return b;
  });

  return {
    set(key, value) {
      overrideValues = nonOverwriteableMerge(overrideValues, {
        [key]: value,
      }) as Partial<T>;
      return this;
    },
    append(key, value) {
      const arrValue = Array.isArray(value) ? value : [value];
      const existingValue = overrideValues[key] || [];
      if (!Array.isArray(existingValue)) {
        throw new Error(
          `Field ${key.toString()} is not array and cannot be appended to in ${name}`
        );
      }
      overrideValues = {
        ...overrideValues,
        [key]: [...existingValue, ...arrValue],
      };
      return this;
    },
    appendUnique(key, value) {
      const arrValue = Array.isArray(value) ? value : [value];
      const existingValue = overrideValues[key];
      if (existingValue) {
        if (!Array.isArray(existingValue)) {
          throw new Error(
            `Field ${key.toString()} is not array and cannot be appended to in ${name}`
          );
        }
        overrideValues = {
          ...overrideValues,
          [key]: R.uniq([...existingValue, ...arrValue]),
        };
      } else {
        overrideValues = {
          ...overrideValues,
          [key]: arrValue,
        };
      }
      return this;
    },
    merge(value) {
      overrideValues = nonOverwriteableMerge(
        overrideValues,
        value
      ) as Partial<T>;
      return this;
    },
    value() {
      return finalMerge(defaults, overrideValues) as T;
    },
    get<K extends keyof T>(key: keyof T): T[K] | undefined {
      const override = overrideValues[key];
      const def = defaults[key];
      if (
        mergeArraysUniquely &&
        Array.isArray(override) &&
        Array.isArray(def)
      ) {
        return R.uniq([...def, ...override]) as T[K];
      }
      return override || def;
    },
  };
}
