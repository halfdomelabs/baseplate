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

  constructor(defaultValue: T) {
    this.defaultValue = defaultValue;
  }

  getValue(): T {
    return this._value === undefined ? this.defaultValue : this._value;
  }

  protected setValue(value: T): void {
    this._value = value;
    this.isSet = true;
  }

  set(value: T, source: string): void {
    if (this.isSet) {
      throw new Error(
        `Value has already been set by ${this.setBySource} and cannot be overwritten by ${source}`,
      );
    }
    this._value = value;
    this.isSet = true;
    this.setBySource = source;
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

  constructor(initialValue: T) {
    this.map = new Map(
      Object.entries(initialValue).map(([key, value]) => [
        key,
        { value, setBySource: undefined },
      ]),
    );
  }

  set(key: keyof T, value: T[keyof T], source: string): void {
    const existingValue = this.map.get(key);
    if (existingValue?.setBySource) {
      throw new Error(
        `Value for key ${key as string} has already been set by ${existingValue.setBySource} and cannot be overwritten by ${source}`,
      );
    }
    this.map.set(key, { value, setBySource: source });
  }

  merge(value: Partial<T>, source: string): void {
    for (const [key, val] of Object.entries(value)) {
      this.set(key as keyof T, val as T[keyof T], source);
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

  constructor(initialValue?: Map<K, V>) {
    const initialMap = initialValue ?? new Map<K, V>();
    this._value = new Map(
      [...initialMap.entries()].map(([key, value]) => [
        key,
        { value, setBySource: undefined },
      ]),
    );
  }

  set(key: K, value: V, source: string): void {
    const existingValue = this._value.get(key);
    if (existingValue?.setBySource) {
      throw new Error(
        `Value for key ${key as string} has already been set by ${existingValue.setBySource} and cannot be overwritten by ${source}`,
      );
    }
    this._value.set(key, { value, setBySource: source });
  }

  merge(value: Map<K, V>, source: string): void {
    for (const [key, val] of value.entries()) {
      this.set(key, val, source);
    }
  }

  mergeObj(value: Record<K, V>, source: string): void {
    for (const [key, val] of Object.entries(value)) {
      this.set(key as K, val as V, source);
    }
  }

  getValue(): Map<K, V> {
    return new Map(
      [...this._value.entries()].map(([key, value]) => [key, value.value]),
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
  scalar<T>(): ScalarContainer<T | undefined>;
  scalar<T>(defaultValue: T): ScalarContainer<T>;
  scalar<T>(defaultValue?: T): ScalarContainer<T | undefined> {
    return new ScalarContainer(defaultValue);
  }

  string(): ScalarContainer<string | undefined>;
  string(defaultValue: string): ScalarContainer<string>;
  string(defaultValue?: string): ScalarContainer<string | undefined> {
    return new ScalarContainer(defaultValue);
  }

  number(): ScalarContainer<number | undefined>;
  number(defaultValue: number): ScalarContainer<number>;
  number(defaultValue?: number): ScalarContainer<number | undefined> {
    return new ScalarContainer(defaultValue);
  }

  boolean(): ScalarContainer<boolean | undefined>;
  boolean(defaultValue: boolean): ScalarContainer<boolean>;
  boolean(defaultValue?: boolean): ScalarContainer<boolean | undefined> {
    return new ScalarContainer(defaultValue);
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
    return new ObjectContainer(defaultValue);
  }

  map<K extends string | number | symbol, V>(
    initialValue?: Map<K, V>,
  ): MapContainer<K, V> {
    return new MapContainer(initialValue ?? new Map<K, V>());
  }

  mapFromObj<V>(initialValue?: Record<string, V>): MapContainer<string, V> {
    return new MapContainer(new Map(Object.entries(initialValue ?? {})));
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
): FieldMap<S> {
  const schema = schemaBuilder(new FieldMapSchemaBuilder());

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
