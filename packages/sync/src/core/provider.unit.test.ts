import { describe, expect, expectTypeOf, it } from 'vitest';

import type { ProviderDependency } from './provider.js';

import { createProviderType } from './provider.js';

interface TestProvider {
  test: (hello: string) => string;
}

type InferDependencyProvider<T> =
  T extends ProviderDependency<infer U> ? U : never;

describe('createProviderType', () => {
  it('allows the setting of optional', () => {
    const provider = createProviderType<TestProvider>('foo');
    const optionalProvider = provider.dependency().optional();
    expect(optionalProvider.options.optional).toBe(true);
    expectTypeOf<
      InferDependencyProvider<typeof optionalProvider>
    >().toEqualTypeOf<TestProvider | undefined>();
  });

  it('allows setting of a reference', () => {
    const provider = createProviderType<TestProvider>('foo');
    const referenceDependency = provider.dependency().reference('bar');
    expect(referenceDependency.options.optional).toBeUndefined();
    expect(referenceDependency.options.reference).toBe('bar');
    expectTypeOf<
      InferDependencyProvider<typeof referenceDependency>
    >().toEqualTypeOf<TestProvider>();
  });

  it('allows setting an optional reference directly', () => {
    const provider = createProviderType<TestProvider>('foo');
    const optionalReferenceDependency = provider
      .dependency()
      .optionalReference('bar');
    expect(optionalReferenceDependency.options.optional).toBe(true);
    expect(optionalReferenceDependency.options.reference).toBe('bar');
    expectTypeOf<
      InferDependencyProvider<typeof optionalReferenceDependency>
    >().toEqualTypeOf<TestProvider | undefined>();
  });

  it('handles undefined reference in optionalReference', () => {
    const provider = createProviderType<TestProvider>('foo');
    const optionalReferenceDependency = provider
      .dependency()
      .optionalReference(undefined);
    expect(optionalReferenceDependency.options.optional).toBe(true);
    expect(optionalReferenceDependency.options.reference).toBeUndefined();
    expectTypeOf<
      InferDependencyProvider<typeof optionalReferenceDependency>
    >().toEqualTypeOf<TestProvider | undefined>();
  });
});
