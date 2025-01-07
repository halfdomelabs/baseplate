import { toMerged } from 'es-toolkit';

/**
 * A provider is a dictionary of functions that allow a generator
 * to interact with a generator
 */
export type Provider = Record<string, (...args: unknown[]) => unknown>;

/**
 * A provider type is a typed tag for a provider so that it can
 * be referrenced programatically while retaining the type
 */
export interface ProviderType<P = Provider> {
  readonly type: 'type';
  readonly name: string;
  /**
   * Whether the provider is read-only or not (i.e. cannot modify any state in the generator task)
   */
  readonly isReadOnly?: boolean;
  /**
   * Creates a dependency config for the provider that can be used in dependency maps
   */
  dependency(): ProviderDependency<P>;
  /**
   * Creates an export config for the provider that can be used in export maps
   */
  export(): ProviderExport<P>;
}

export interface ProviderDependencyOptions {
  /**
   * Whether the dependency is optional or not
   */
  optional?: boolean;
  /**
   * The mode to use for resolving the dependency
   *
   * - `default` - The dependency is resolved via the default resolution algorithm
   * - `explicit` - The dependency is resolved to a provided reference
   */
  resolutionMode?: 'default' | 'explicit';
  /**
   * The global ID of the generator to resolve to
   */
  reference?: string;
  /**
   * Whether the provider is read-only or not (i.e. cannot modify any state in the generator task)
   */
  readonly isReadOnly?: boolean;
}

export interface ProviderDependency<P = Provider> {
  readonly type: 'dependency';
  readonly name: string;
  readonly options: ProviderDependencyOptions;
  /**
   * Creates an optional dependency
   */
  optional(): ProviderDependency<P | undefined>;
  /**
   * Specifies that the dependency should be resolved to an export from
   * a specific generator
   *
   * @param generatorGlobalId The global ID of the generator to resolve to
   */
  reference(generatorGlobalId: string): ProviderDependency<P>;
  /**
   * Specifies that the dependency should be resolved to an export from
   * a specific generator, but otherwise resolve to undefined if no
   * reference is provided
   *
   * @param generatorGlobalId The global ID of the generator to resolve to
   * if the reference is provided
   */
  optionalReference(
    generatorGlobalId: string | undefined,
  ): ProviderDependency<P | undefined>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- we need to keep the generic type for inference
export interface ProviderExport<P = Provider> {
  readonly type: 'export';
  readonly name: string;
}

interface ProviderTypeOptions {
  isReadOnly?: boolean;
}

export function createProviderType<T>(
  name: string,
  options?: ProviderTypeOptions,
): ProviderType<T> {
  return {
    type: 'type',
    name,
    isReadOnly: options?.isReadOnly,
    dependency() {
      return {
        ...this,
        type: 'dependency',
        options: options?.isReadOnly ? { isReadOnly: true } : {},
        optional() {
          return toMerged(this, { options: { optional: true } });
        },
        reference(reference) {
          if (this.options.resolutionMode === 'explicit') {
            throw new Error('Cannot overwrite reference on provider type');
          }
          return toMerged(this, {
            options: { reference, resolutionMode: 'explicit' },
          });
        },
        optionalReference(reference) {
          if (this.options.resolutionMode === 'explicit') {
            throw new Error('Cannot overwrite reference on provider type');
          }
          return toMerged(this, {
            options: { reference, resolutionMode: 'explicit', optional: true },
          });
        },
      };
    },
    export() {
      return {
        ...this,
        type: 'export',
        options: {},
      };
    },
  };
}
