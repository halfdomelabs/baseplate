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
}

export type PluginSpecImplementationFromSpec<T extends PluginSpec> =
  T extends PluginSpec<infer TImplementation> ? TImplementation : never;

export function createPluginSpec<T = PluginSpecImplementation>(
  name: string,
  platforms?: PluginSpecPlatform | PluginSpecPlatform[],
): PluginSpec<T> {
  return {
    type: 'plugin-spec',
    name,
    platforms:
      platforms && (Array.isArray(platforms) ? platforms : [platforms]),
    isOptional: false,
    optional() {
      return { ...this, isOptional: true };
    },
  };
}
