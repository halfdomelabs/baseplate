/* eslint-disable @typescript-eslint/no-explicit-any */
import R from 'ramda';

export type Provider = Record<string, (...args: any[]) => any>;

export interface ProviderType<P = Provider> {
  readonly type: 'type';
  readonly name: string;
  dependency(): ProviderDependency<P>;
}

export interface ProviderDependency<P = Provider> {
  readonly type: 'dependency';
  readonly name: string;
  readonly options: {
    optional?: boolean;
  };
  optional(): ProviderDependency<P | undefined>;
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
      };
    },
  };
}
