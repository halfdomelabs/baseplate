type PluginSpecPlatform = 'web' | 'node';

export type PluginSpecImplementation = Record<string, unknown>;

export interface PluginSpec<T = PluginSpecImplementation> {
  readonly type: 'plugin-spec';
  readonly name: string;
  // Platforms supported by the spec (leave empty to support all platforms)
  readonly platforms?: PluginSpecPlatform[];

  readonly placeholderType?: T;

  readonly isOptional: boolean;

  optional(): PluginSpec<T | undefined>;

  defaultInitializer?: () => T;
}

export interface PluginSpecWithInitializer<T = PluginSpecImplementation>
  extends PluginSpec<T> {
  defaultInitializer: () => T;
}

export interface InitializedPluginSpec<T = PluginSpecImplementation> {
  spec: PluginSpec<T>;
  implementation: T;
}

export function createInitializedPluginSpec<T = PluginSpecImplementation>(
  spec: PluginSpec<T>,
  implementation: T,
): InitializedPluginSpec<T> {
  return { spec, implementation };
}

export type PluginSpecImplementationFromSpec<T extends PluginSpec> =
  T extends PluginSpec<infer TImplementation> ? TImplementation : never;

export function createPluginSpec<T = PluginSpecImplementation>(
  name: string,
  options: {
    platforms?: PluginSpecPlatform | PluginSpecPlatform[];
    defaultInitializer: () => T;
  },
): PluginSpecWithInitializer<T>;
export function createPluginSpec<T = PluginSpecImplementation>(
  name: string,
  options?: {
    platforms?: PluginSpecPlatform | PluginSpecPlatform[];
  },
): PluginSpec<T>;
export function createPluginSpec<T = PluginSpecImplementation>(
  name: string,
  options?: {
    platforms?: PluginSpecPlatform | PluginSpecPlatform[];
    defaultInitializer?: () => T;
  },
): PluginSpec<T> {
  const { platforms, defaultInitializer } = options ?? {};
  return {
    type: 'plugin-spec',
    name,
    platforms:
      platforms && (Array.isArray(platforms) ? platforms : [platforms]),
    isOptional: false,
    optional() {
      return { ...this, isOptional: true };
    },
    defaultInitializer,
  };
}
