import { describe, expect, expectTypeOf, it } from 'vitest';

import type { GeneratorTaskOutputBuilder } from '@src/output/generator-task-output.js';

import { createProviderType } from '@src/providers/index.js';

import type {
  GeneratorTask,
  InferDependencyProviderMap,
  InferExportProviderMap,
  ProviderDependencyMap,
  ProviderExportMap,
} from './generators.js';

function createTask<
  ExportMap extends ProviderExportMap | undefined = undefined,
  DependencyMap extends ProviderDependencyMap = ProviderDependencyMap,
  OutputMap extends ProviderExportMap | undefined = undefined,
>(
  taskResult: GeneratorTask<ExportMap, DependencyMap, OutputMap>,
): GeneratorTask<ExportMap, DependencyMap, OutputMap> {
  return taskResult;
}

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
    expectTypeOf<InferredExportMap>().toMatchTypeOf<{
      test: TestProvider;
      config: ConfigProvider;
    }>();

    // Test InferDependencyProviderMap
    type InferredDependencyMap = InferDependencyProviderMap<TestDependencyMap>;
    expectTypeOf<InferredDependencyMap>().toMatchTypeOf<{
      test: TestProvider;
      config: ConfigProvider;
    }>();
  });

  it('should correctly type generator task results no exports', () => {
    const taskOutput = createTask({
      name: 'test',
      taskDependencies: [],
      exports: {},
      run: () => ({}),
    });

    expectTypeOf<ReturnType<(typeof taskOutput)['run']>>().toMatchTypeOf<{
      build?: (builder: GeneratorTaskOutputBuilder) => Promise<void> | void;
    }>();
    expect(taskOutput.name).toBe('test');
  });

  it('should correctly type generator task results no exports but output providers', () => {
    const taskOutput = createTask({
      name: 'test',
      taskDependencies: [],
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
    expect(taskOutput.name).toBe('test');
  });

  it('should correctly type generator tasks with exports and outputs', () => {
    const taskOutput = createTask({
      name: 'test',
      taskDependencies: [],
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

    expect(taskOutput.name).toBe('test');
  });
});
