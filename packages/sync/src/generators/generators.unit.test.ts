import { describe, expect, expectTypeOf, it } from 'vitest';

import { createProviderType } from '#src/providers/index.js';

import type {
  InferDependencyProviderMap,
  InferExportProviderMap,
  ProviderDependencyMap,
  ProviderExportMap,
} from './generators.js';

import { createGeneratorTask } from './generators.js';

describe('generators type definitions', () => {
  it('should correctly infer provider maps from export and dependency maps', () => {
    // Define test provider types
    interface TestProvider {
      test: () => string;
    }
    interface ConfigProvider {
      getConfig: () => object;
    }

    // Test ProviderExportMap
    type TestExportMap = ProviderExportMap<{
      test: TestProvider;
      config: ConfigProvider;
    }>;

    // Test ProviderDependencyMap
    type TestDependencyMap = ProviderDependencyMap<{
      test: TestProvider;
      config: ConfigProvider;
    }>;

    // Test InferExportProviderMap
    type InferredExportMap = InferExportProviderMap<TestExportMap>;
    expectTypeOf<InferredExportMap>().toMatchObjectType<{
      test: TestProvider;
      config: ConfigProvider;
    }>();

    // Test InferDependencyProviderMap
    type InferredDependencyMap = InferDependencyProviderMap<TestDependencyMap>;
    expectTypeOf<InferredDependencyMap>().toMatchObjectType<{
      test: TestProvider | undefined;
      config: ConfigProvider | undefined;
    }>();
  });

  it('should correctly type generator task results no exports', () => {
    const taskOutput = createGeneratorTask({
      exports: {},
      run: () => ({}),
    });

    expect(taskOutput).toBeDefined();
  });

  it('should correctly type generator task results no exports nor output providers', () => {
    const taskOutput = createGeneratorTask({
      run: () => ({
        build: () => {
          // do nothing
        },
      }),
    });

    expect(taskOutput).toBeDefined();
  });

  it('should correctly type generator task results no exports but output providers', () => {
    const taskOutput = createGeneratorTask({
      outputs: {
        test: createProviderType<{ value: string }>('test').export(),
      },
      run: () => ({
        build: () => ({ test: { value: 'test' } }),
      }),
    });

    expectTypeOf<ReturnType<(typeof taskOutput)['run']>>().toHaveProperty(
      'build',
    );
    expect(taskOutput).toBeDefined();
  });

  it('should correctly type generator tasks with exports and outputs', () => {
    const taskOutput = createGeneratorTask({
      exports: {
        test: createProviderType<{ value: string }>('test').export(),
      },
      outputs: {
        test: createProviderType<{ value: string }>('test').export(),
      },
      run: () => ({
        providers: {
          test: { value: 'test' },
        },
        build: () => ({ test: { value: 'test' } }),
      }),
    });

    expect(taskOutput).toBeDefined();
  });
});
