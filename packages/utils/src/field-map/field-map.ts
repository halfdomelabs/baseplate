import { sortBy } from 'es-toolkit';

export type FieldContainerDynamicSourceGetter = () => string | undefined;

export interface FieldContainerOptions {
  /**
   * A function that returns the source of the value.
   *
   * @returns The source of the value, or undefined if the value is not set.
   */
  getDynamicSource?: FieldContainerDynamicSourceGetter;
}

/**
 * Base field container interface
 */
export interface FieldContainer<T> {
  getValue(): T;
}

/**
 * Field container for a single value that cannot be overridden once set
 */
export class ScalarContainer<T> implements FieldContainer<T> {
  private _value: T | undefined;
  protected readonly defaultValue: T;
  protected isSet = false;
  protected setBySource: string | undefined;
  protected getDynamicSource: FieldContainerDynamicSourceGetter | undefined;

  constructor(defaultValue: T, options?: FieldContainerOptions) {
    this.defaultValue = defaultValue;
    this.getDynamicSource = options?.getDynamicSource;
  }

  getValue(): T {
    return this._value === undefined ? this.defaultValue : this._value;
  }

  set(value: T, source?: string): void {
    if (this.isSet) {
      throw new Error(
        `Value has already been set by ${this.setBySource} and cannot be overwritten by ${source}`,
      );
    }
    this._value = value;
    this.isSet = true;
    this.setBySource = source ?? this.getDynamicSource?.() ?? 'unknown';
  }
}

// Array field container
export class ArrayContainer<T> implements FieldContainer<T[]> {
  private readonly _stripDuplicates: boolean;
  private _value: T[];

  constructor(initialValue?: T[], options?: { stripDuplicates?: boolean }) {
    this._stripDuplicates = options?.stripDuplicates ?? false;
    this._value = initialValue ?? [];
  }

  push(...items: T[]): void {
    let currentValue = this._value;

    if (this._stripDuplicates) {
      // Add items without duplicates
      const set = new Set([...currentValue, ...items]);
      currentValue = [...set];
    } else {
      // Add all items
      currentValue = [...currentValue, ...items];
    }

    this._value = currentValue;
  }

  getValue(): T[] {
    return this._value;
  }
}

export class ObjectContainer<T extends Record<string, unknown>>
  implements FieldContainer<T>
{
  private readonly map: Map<
    keyof T,
    { value: unknown; setBySource: string | undefined }
  >;
  protected getDynamicSource: FieldContainerDynamicSourceGetter | undefined;

  constructor(initialValue: T, options?: FieldContainerOptions) {
    this.getDynamicSource = options?.getDynamicSource;
    this.map = new Map(
      Object.entries(initialValue).map(([key, value]) => [
        key,
        { value, setBySource: this.getDynamicSource?.() },
      ]),
    );
  }

  set(key: keyof T, value: T[keyof T], source?: string): void {
    const existingValue = this.map.get(key);
    if (existingValue?.setBySource) {
      throw new Error(
        `Value for key ${key as string} has already been set by ${existingValue.setBySource} and cannot be overwritten by ${source}`,
      );
    }
    this.map.set(key, {
      value,
      setBySource: source ?? this.getDynamicSource?.(),
    });
  }

  merge(value: Partial<T>, source?: string): void {
    const mergeSource = source ?? this.getDynamicSource?.();
    for (const [key, val] of Object.entries(value)) {
      this.set(key as keyof T, val as T[keyof T], mergeSource);
    }
  }

  getValue(): T {
    return Object.fromEntries(
      [...this.map.entries()].map(([key, value]) => [key, value.value]),
    ) as T;
  }
}

// Map field container
export class MapContainer<K extends string | number | symbol, V>
  implements FieldContainer<Map<K, V>>
{
  private readonly _value: Map<
    K,
    { value: V; setBySource: string | undefined }
  >;
  protected getDynamicSource: FieldContainerDynamicSourceGetter | undefined;

  constructor(initialValue?: Map<K, V>, options?: FieldContainerOptions) {
    this.getDynamicSource = options?.getDynamicSource;
    const initialMap = initialValue ?? new Map<K, V>();
    this._value = new Map(
      [...initialMap.entries()].map(([key, value]) => [
        key,
        { value, setBySource: this.getDynamicSource?.() },
      ]),
    );
  }

  set(key: K, value: V, source?: string): void {
    const existingValue = this._value.get(key);
    if (existingValue?.setBySource) {
      throw new Error(
        `Value for key ${key as string} has already been set by ${existingValue.setBySource} and cannot be overwritten by ${source}`,
      );
    }
    this._value.set(key, {
      value,
      setBySource: source ?? this.getDynamicSource?.(),
    });
  }

  merge(value: Map<K, V>, source?: string): void {
    const mergeSource = source ?? this.getDynamicSource?.();
    for (const [key, val] of value.entries()) {
      this.set(key, val, mergeSource);
    }
  }

  mergeObj(value: Record<K, V>, source?: string): void {
    const mergeSource = source ?? this.getDynamicSource?.();
    for (const [key, val] of Object.entries(value)) {
      this.set(key as K, val as V, mergeSource);
    }
  }

  getValue(): Map<K, V> {
    return new Map(
      [...this._value.entries()].map(([key, value]) => [key, value.value]),
    );
  }
}

/**
 * Named field container
 *
 * This container stores objects that contains a name field that can be used for
 * detecting duplicate names.
 */
export class NamedArrayFieldContainer<V extends { name: string }>
  implements FieldContainer<V[]>
{
  private readonly _value: Map<
    string,
    { value: V; setBySource: string | undefined }
  >;
  protected getDynamicSource: FieldContainerDynamicSourceGetter | undefined;

  constructor(initialValue?: V[], options?: FieldContainerOptions) {
    this.getDynamicSource = options?.getDynamicSource;
    const value = initialValue ?? [];
    this._value = new Map(
      value.map((val) => [
        val.name,
        { value: val, setBySource: this.getDynamicSource?.() },
      ]),
    );
  }

  add(value: V, source?: string): void {
    const existingValue = this._value.get(value.name);
    if (existingValue?.setBySource) {
      throw new Error(
        `Value for name ${value.name} has already been set by ${existingValue.setBySource} and cannot be overwritten by ${source}`,
      );
    }
    this._value.set(value.name, {
      value,
      setBySource: source ?? this.getDynamicSource?.(),
    });
  }

  addMany(values: V[], source?: string): void {
    for (const value of values) {
      this.add(value, source);
    }
  }

  getValue(): V[] {
    return sortBy(
      [...this._value.values()].map((value) => value.value),
      [(v) => v.name],
    );
  }
}

// Map of maps field container
export class MapOfMapsContainer<
  K1 extends string | number | symbol,
  K2 extends string | number | symbol,
  V,
> implements FieldContainer<Map<K1, Map<K2, V>>>
{
  private readonly _value: Map<
    K1,
    {
      value: Map<K2, { value: V; setBySource: string | undefined }>;
      setBySource: string | undefined;
    }
  >;
  protected getDynamicSource: FieldContainerDynamicSourceGetter | undefined;

  constructor(
    initialValue?: Map<K1, Map<K2, V>>,
    options?: FieldContainerOptions,
  ) {
    this.getDynamicSource = options?.getDynamicSource;
    const initialMap = initialValue ?? new Map<K1, Map<K2, V>>();
    this._value = new Map(
      [...initialMap.entries()].map(([key1, innerMap]) => [
        key1,
        {
          value: new Map<K2, { value: V; setBySource: string | undefined }>(
            [...innerMap.entries()].map(([key2, value]) => [
              key2,
              { value, setBySource: this.getDynamicSource?.() },
            ]),
          ),
          setBySource: this.getDynamicSource?.(),
        },
      ]),
    );
  }

  set(key1: K1, key2: K2, value: V, source?: string): void {
    const existingOuterValue = this._value.get(key1);
    const sourceToUse = source ?? this.getDynamicSource?.() ?? 'unknown';

    // If the outer key doesn't exist yet, create a new map for it
    if (!existingOuterValue) {
      const newInnerMap = new Map<
        K2,
        { value: V; setBySource: string | undefined }
      >();
      newInnerMap.set(key2, { value, setBySource: sourceToUse });
      this._value.set(key1, {
        value: newInnerMap,
        setBySource: sourceToUse,
      });
      return;
    }

    // Check if this specific key1+key2 combination has already been set
    const existingInnerValue = existingOuterValue.value.get(key2);
    if (existingInnerValue?.setBySource) {
      throw new Error(
        `Value for keys ${key1 as string}+${key2 as string} has already been set by ${existingInnerValue.setBySource} and cannot be overwritten by ${sourceToUse}`,
      );
    }

    // Add the new value to the existing inner map
    existingOuterValue.value.set(key2, {
      value,
      setBySource: sourceToUse,
    });
  }

  merge(key1: K1, value: Map<K2, V>, source?: string): void {
    const mergeSource = source ?? this.getDynamicSource?.() ?? 'unknown';
    for (const [key2, val] of value.entries()) {
      this.set(key1, key2, val, mergeSource);
    }
  }

  mergeObj(key1: K1, value: Record<K2, V>, source?: string): void {
    const mergeSource = source ?? this.getDynamicSource?.() ?? 'unknown';
    for (const [key2, val] of Object.entries(value)) {
      this.set(key1, key2 as K2, val as V, mergeSource);
    }
  }

  getValue(): Map<K1, Map<K2, V>> {
    return new Map(
      [...this._value.entries()].map(([key1, outerValue]) => [
        key1,
        new Map(
          [...outerValue.value.entries()].map(([key2, innerValue]) => [
            key2,
            innerValue.value,
          ]),
        ),
      ]),
    );
  }
}

type InferFieldContainer<T> = T extends FieldContainer<infer U> ? U : never;

// Schema type
export type FieldMapSchema = Record<string, FieldContainer<unknown>>;

// Type for values returned by getValues()
export type FieldMapValues<S extends FieldMapSchema> = {
  [K in keyof S]: InferFieldContainer<S[K]>;
};

// FieldMap type based on schema
export type FieldMap<S extends FieldMapSchema> = S & {
  getValues(): FieldMapValues<S>;
};

// Schema builder class
export class FieldMapSchemaBuilder {
  constructor(public options?: FieldContainerOptions) {}

  scalar<T>(): ScalarContainer<T | undefined>;
  scalar<T>(defaultValue: T): ScalarContainer<T>;
  scalar<T>(defaultValue?: T): ScalarContainer<T | undefined> {
    return new ScalarContainer(defaultValue, this.options);
  }

  string(): ScalarContainer<string | undefined>;
  string(defaultValue: string): ScalarContainer<string>;
  string(defaultValue?: string): ScalarContainer<string | undefined> {
    return new ScalarContainer(defaultValue, this.options);
  }

  number(): ScalarContainer<number | undefined>;
  number(defaultValue: number): ScalarContainer<number>;
  number(defaultValue?: number): ScalarContainer<number | undefined> {
    return new ScalarContainer(defaultValue, this.options);
  }

  boolean(): ScalarContainer<boolean | undefined>;
  boolean(defaultValue: boolean): ScalarContainer<boolean>;
  boolean(defaultValue?: boolean): ScalarContainer<boolean | undefined> {
    return new ScalarContainer(defaultValue, this.options);
  }

  array<T>(
    initialValue?: T[],
    options?: { stripDuplicates?: boolean },
  ): ArrayContainer<T> {
    return new ArrayContainer(initialValue, options);
  }

  object<T extends Record<string, unknown>>(
    defaultValue: T,
  ): ObjectContainer<T> {
    return new ObjectContainer(defaultValue, this.options);
  }

  map<K extends string | number | symbol, V>(
    initialValue?: Map<K, V>,
  ): MapContainer<K, V> {
    return new MapContainer(initialValue ?? new Map<K, V>(), this.options);
  }

  mapFromObj<V>(initialValue?: Record<string, V>): MapContainer<string, V> {
    return new MapContainer(
      new Map(Object.entries(initialValue ?? {})),
      this.options,
    );
  }

  namedArray<V extends { name: string }>(
    initialValue?: V[],
  ): NamedArrayFieldContainer<V> {
    return new NamedArrayFieldContainer(initialValue, this.options);
  }

  mapOfMaps<
    K1 extends string | number | symbol,
    K2 extends string | number | symbol,
    V,
  >(initialValue?: Map<K1, Map<K2, V>>): MapOfMapsContainer<K1, K2, V> {
    return new MapOfMapsContainer(
      initialValue ?? new Map<K1, Map<K2, V>>(),
      this.options,
    );
  }

  mapOfMapsFromObj<K2 extends string | number | symbol, V>(
    initialValue?: Record<string, Record<K2, V>>,
  ): MapOfMapsContainer<string, K2, V> {
    const map = new Map<string, Map<K2, V>>();
    if (initialValue) {
      for (const [key1, innerObj] of Object.entries(initialValue)) {
        map.set(key1, new Map(Object.entries(innerObj) as [K2, V][]));
      }
    }
    return new MapOfMapsContainer(map, this.options);
  }
}

export function createFieldMapSchemaBuilder<T extends FieldMapSchema>(
  schemaBuilder: (t: FieldMapSchemaBuilder) => T,
): (t: FieldMapSchemaBuilder) => T {
  return schemaBuilder;
}

export type InferFieldMapSchemaFromBuilder<
  T extends (t: FieldMapSchemaBuilder) => FieldMapSchema,
> = T extends (t: FieldMapSchemaBuilder) => infer U ? U : never;

/**
 * Creates a field map with type-safe field definitions
 */
export function createFieldMap<S extends FieldMapSchema>(
  schemaBuilder: (t: FieldMapSchemaBuilder) => S,
  options?: FieldContainerOptions,
): FieldMap<S> {
  const schema = schemaBuilder(new FieldMapSchemaBuilder(options));

  // Add getValues method
  return {
    ...schema,
    getValues: () => {
      const values = {} as FieldMapValues<S>;

      for (const key of Object.keys(schema)) {
        const container = schema[key];
        (values as Record<string, unknown>)[key] = container.getValue();
      }

      return values;
    },
  };
}
