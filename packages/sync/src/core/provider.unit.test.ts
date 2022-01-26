import { createProviderType } from './provider';

interface TestProvider {
  test: (hello: string) => string;
}

describe('createProviderType', () => {
  it('allows the setting of optional', () => {
    const provider = createProviderType<TestProvider>('foo');
    const optionalProvider = provider.dependency().optional();
    expect(optionalProvider.options.optional).toBe(true);
  });

  it('allows setting of an optional reference', () => {
    const provider = createProviderType<TestProvider>('foo');
    const optionalReferenceDependency = provider
      .dependency()
      .reference('bar')
      .optional();
    expect(optionalReferenceDependency.options.optional).toBe(true);
    expect(optionalReferenceDependency.options.reference).toBe('bar');
  });
});
