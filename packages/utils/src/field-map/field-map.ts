// Base field container class
export abstract class FieldContainer<T> {
  private _value: T | undefined;
  protected readonly defaultValue: T;
  protected isSet = false;

  constructor(defaultValue: T) {
    this.defaultValue = structuredClone(defaultValue);
  }

  get value(): T {
    return this._value === undefined ? this.defaultValue : this._value;
  }

  protected setValue(value: T): void {
    this._value = value;
    this.isSet = true;
  }
}

// Scalar field container
export class ScalarContainer<T> extends FieldContainer<T> {
  protected setBySource: string | undefined;

  set(value: T, source: string): void {
    if (this.isSet) {
      throw new Error(
        `Value has already been set by ${this.setBySource} and cannot be overwritten by ${source}`,
      );
    }
    this.setValue(value);
    this.setBySource = source;
  }
}

// Array field container
export class ArrayContainer<T> extends FieldContainer<T[]> {
  private readonly stripDuplicates: boolean;

  constructor(defaultValue?: T[], options?: { stripDuplicates?: boolean }) {
    super(defaultValue ?? []);
    this.stripDuplicates = options?.stripDuplicates ?? false;
  }

  push(...items: T[]): void {
    let currentValue = this.value;

    if (this.stripDuplicates) {
      // Add items without duplicates
      const set = new Set([...currentValue, ...items]);
      currentValue = [...set];
    } else {
      // Add all items
      currentValue = [...currentValue, ...items];
    }

    this.setValue(currentValue);
  }
}

export class ObjectContainer<
  T extends Record<string, unknown>,
> extends FieldContainer<T> {
  private readonly map: Map<
    keyof T,
    { value: unknown; setBySource: string | undefined }
  >;

  constructor(defaultValue: T) {
    super(defaultValue);
    this.map = new Map(
      Object.entries(defaultValue).map(([key, value]) => [
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

  get value(): T {
    return Object.fromEntries(
      [...this.map.entries()].map(([key, value]) => [key, value.value]),
    ) as T;
  }
}

// Map field container
export class MapContainer<
  K extends string | number | symbol,
  V,
> extends FieldContainer<Map<K, V>> {
  private readonly map: Map<K, { value: V; setBySource: string | undefined }>;

  constructor(defaultValue?: Map<K, V>) {
    const initialMap = defaultValue ?? new Map<K, V>();
    super(initialMap);
    this.map = new Map(
      [...initialMap.entries()].map(([key, value]) => [
        key,
        { value, setBySource: undefined },
      ]),
    );
  }

  set(key: K, value: V, source: string): void {
    const existingValue = this.map.get(key);
    if (existingValue?.setBySource) {
      throw new Error(
        `Value for key ${key as string} has already been set by ${existingValue.setBySource} and cannot be overwritten by ${source}`,
      );
    }
    this.map.set(key, { value, setBySource: source });
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

  get value(): Map<K, V> {
    return new Map(
      [...this.map.entries()].map(([key, value]) => [key, value.value]),
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
    defaultValue?: T[],
    options?: { stripDuplicates?: boolean },
  ): ArrayContainer<T> {
    return new ArrayContainer(defaultValue ?? [], options);
  }

  object<T extends Record<string, unknown>>(
    defaultValue: T,
  ): ObjectContainer<T> {
    return new ObjectContainer(defaultValue);
  }

  map<K extends string | number | symbol, V>(
    defaultValue?: Map<K, V>,
  ): MapContainer<K, V> {
    return new MapContainer(defaultValue ?? new Map<K, V>());
  }

  mapFromObj<V>(defaultValue?: Record<string, V>): MapContainer<string, V> {
    return new MapContainer(new Map(Object.entries(defaultValue ?? {})));
  }
}

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
        (values as Record<string, unknown>)[key] = container.value;
      }

      return values;
    },
  };
}
