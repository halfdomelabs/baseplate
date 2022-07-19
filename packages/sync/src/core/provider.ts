import R from 'ramda';

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
   * Where the dependency should be resolved from
   */
  reference?: string;
  /**
   * Whether the dependency is modified in the build output of this generator (deprecated)
   */
  modifiedInBuild?: boolean;
  /**
   * Whether to resolve the dependency to null always (good for disabling a dependency)
   */
  resolveToNull?: boolean;
  /**
   * Whether the provider is read-only or not (i.e. cannot modify any state in the generator task)
   */
  readonly isReadOnly?: boolean;
}

export interface ProviderDependency<P = Provider> {
  readonly type: 'dependency';
  readonly name: string;
  readonly options: ProviderDependencyOptions;
  optional(): ProviderDependency<P | undefined>;
  reference(reference?: string): ProviderDependency<P>;
  /**
   * Deprecated
   */
  modifiedInBuild(): ProviderDependency<P>;
  resolveToNull(): ProviderDependency<P | undefined>;
}

export interface ProviderExportOptions {
  /**
   * A provider export may depend on another provider export being set up
   * before it can be used. Practically this means that all generators
   * that depend on this export will depend on the generators that depend
   * on the specified export.
   */
  dependencies?: ProviderType[];
}

export interface ProviderExport<P = Provider> {
  readonly type: 'export';
  readonly name: string;
  readonly options: ProviderExportOptions;
  /**
   * Deprecated.
   */
  dependsOn(deps: ProviderType | ProviderType[]): ProviderExport<P>;
}

interface ProviderTypeOptions {
  isReadOnly?: boolean;
}

export function createProviderType<T>(
  name: string,
  options?: ProviderTypeOptions
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
          return R.mergeDeepLeft({ options: { optional: true } }, this);
        },
        reference(reference: string) {
          // allow for undefined references
          if (!reference) {
            return this;
          }
          if (!this.reference) {
            throw new Error('Cannot overwrite reference on provider type');
          }
          return R.mergeDeepLeft({ options: { reference } }, this);
        },
        modifiedInBuild() {
          return R.mergeDeepLeft({ options: { modifiedInBuild: true } }, this);
        },
        resolveToNull() {
          return R.mergeDeepLeft({ options: { resolveToNull: true } }, this);
        },
      };
    },
    export() {
      return {
        ...this,
        type: 'export',
        options: {},
        dependsOn(deps) {
          const dependencies = Array.isArray(deps) ? deps : [deps];
          return {
            ...this,
            options: {
              ...this.options,
              dependencies: [
                ...(this.options.dependencies || []),
                ...dependencies,
              ],
            },
          };
        },
      };
    },
  };
}
