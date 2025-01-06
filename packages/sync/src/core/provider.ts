import * as R from 'ramda';

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
  resolveToNull(): ProviderDependency<P | undefined>;
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
          return R.mergeDeepLeft({ options: { optional: true } }, this);
        },
        reference(reference: string) {
          // allow for undefined references
          if (!reference) {
            return this;
          }
          if (this.options.reference) {
            throw new Error('Cannot overwrite reference on provider type');
          }
          return R.mergeDeepLeft({ options: { reference } }, this);
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
      };
    },
  };
}
