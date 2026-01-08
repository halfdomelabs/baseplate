export type PluginSpecPlatform = 'web' | 'node';

/**
 * Result returned by a plugin spec initializer.
 * Contains separate interfaces for init (mutable) and use (read-only) phases.
 */
export interface PluginSpecInitializerResult<
  TInit extends object = object,
  TUse extends object = object,
> {
  /** Init interface - mutable methods for registration during plugin initialization */
  init: TInit;
  /** Use interface - read-only methods for consumption after initialization */
  use: () => TUse;
}

/**
 * Options for creating a plugin spec.
 */
export interface PluginSpecOptions<TInit extends object, TUse extends object> {
  /** Initializer function that creates the init and use interfaces */
  initializer: () => PluginSpecInitializerResult<TInit, TUse>;
}

/**
 * A plugin spec defines a shared capability that can be registered to during
 * plugin initialization and consumed afterwards.
 *
 * Specs use two separate interfaces:
 * - `init`: Mutable interface used during plugin initialization for registration
 * - `use`: Read-only interface used after initialization (compilation, UI, etc.)
 *
 * This separation is enforced by TypeScript - callers must explicitly choose
 * which interface to use, preventing accidental mutations after initialization.
 */
export interface PluginSpec<
  TInit extends object = object,
  TUse extends object = object,
> {
  readonly type: 'plugin-spec';
  readonly name: string;
  /** Initializer function that creates the init and use interfaces */
  readonly initializer: () => PluginSpecInitializerResult<TInit, TUse>;
}

/**
 * Extracts the init type from a PluginSpec.
 */
export type InferPluginSpecInit<T> = T extends PluginSpec<infer I> ? I : never;

/**
 * Extracts the use type from a PluginSpec.
 */
export type InferPluginSpecUse<T> =
  T extends PluginSpec<object, infer U> ? U : never;

/**
 * Creates a plugin spec with init and use phases.
 *
 * @example
 * ```typescript
 * const mySpec = createPluginSpec('core/my-spec', {
 *   initializer: () => {
 *     const items = new Map<string, Item>();
 *     return {
 *       init: {
 *         register: (item: Item) => items.set(item.name, item),
 *       },
 *       use: () => ({
 *         get: (name: string) => items.get(name),
 *         getAll: () => [...items.values()],
 *       }),
 *     };
 *   },
 * });
 * ```
 *
 * @param name - Unique identifier for the spec (e.g., 'core/my-spec')
 * @param options - Options including the initializer function
 * @returns A plugin spec that can be used with SpecStore
 */
export function createPluginSpec<TInit extends object, TUse extends object>(
  name: string,
  options: PluginSpecOptions<TInit, TUse>,
): PluginSpec<TInit, TUse> {
  const { initializer } = options;
  return {
    type: 'plugin-spec',
    name,
    initializer,
  };
}
