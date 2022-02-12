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
}

export interface ProviderDependency<P = Provider> {
  readonly type: 'dependency';
  readonly name: string;
  readonly options: ProviderDependencyOptions;
  optional(): ProviderDependency<P | undefined>;
  reference(reference: string): ProviderDependency<P>;
}

export interface ProviderExportOptions {
  /**
   * Whether the export is an output provider. When another generator
   * depends on an output provider, it will depend on all generators
   * that are dependent on the provider. Effectively, this means
   * that it will access the provider once the generator has been built.
   *
   * TODO: Need implementation
   */
  output?: boolean;
}

export interface ProviderExport<P = Provider> {
  readonly type: 'export';
  readonly name: string;
  readonly options: ProviderExportOptions;
  output(): ProviderExport<P>;
}

export function createProviderType<T>(name: string): ProviderType<T> {
  return {
    type: 'type',
    name,
    dependency() {
      return {
        ...this,
        type: 'dependency',
        options: {},
        optional() {
          return R.mergeDeepLeft({ options: { optional: true } }, this);
        },
        reference(reference: string) {
          if (!this.reference) {
            throw new Error('Cannot overwrite reference on provider type');
          }
          return R.mergeDeepLeft({ options: { reference } }, this);
        },
      };
    },
    export() {
      return {
        ...this,
        type: 'export',
        options: {},
        output() {
          return R.mergeDeepLeft({ options: { output: true } }, this);
        },
      };
    },
  };
}
