/* eslint-disable @typescript-eslint/no-explicit-any */
import R from 'ramda';

export interface ProviderType<Provider = any> {
  readonly _type: 'type';
  readonly name: string;
  dependency(): ProviderDependency<Provider>;
}

export interface ProviderDependency<Provider = any> {
  readonly _type: 'dependency';
  readonly name: string;
  readonly options: {
    optional?: boolean;
  };
  optional(): ProviderDependency<Provider | undefined>;
}

export function createProviderType<T>(name: string): ProviderType<T> {
  return {
    _type: 'type',
    name,
    dependency() {
      return {
        ...this,
        _type: 'dependency',
        options: {},
        optional() {
          return R.mergeDeepLeft({ options: { optional: true } }, this);
        },
      };
    },
  };
}
