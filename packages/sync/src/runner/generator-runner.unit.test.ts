import { describe, expect, it, vi } from 'vitest';

import type { GeneratorTaskOutputBuilder } from '@src/output/generator-task-output.js';
import type { TaskPhase } from '@src/phases/types.js';

import { POST_WRITE_COMMAND_PRIORITY } from '@src/output/post-write-commands/types.js';
import { createEventedLogger } from '@src/utils/index.js';

import type {
  GeneratorEntry,
  ProviderDependencyMap,
  ProviderExportMap,
} from '../generators/index.js';
import type { Provider } from '../providers/index.js';

import {
  createProviderType,
  createReadOnlyProviderType,
} from '../providers/index.js';
import { executeGeneratorEntry } from './generator-runner.js';
import { getRunnerContext } from './runner-context.js';
import {
  buildTestGeneratorEntry,
  buildTestGeneratorTaskEntry,
} from './tests/factories.test-helper.js';

const logger = createEventedLogger({ noConsole: true });

// Create test phases
const phase1: TaskPhase = {
  name: 'phase1',
  options: {},
};
const phase2: TaskPhase = {
  name: 'phase2',
  options: {
    consumesOutputFrom: [phase1],
  },
};

function buildGeneratorEntry(
  options: {
    id?: string;
    children?: GeneratorEntry[];
    dependencyMap?: ProviderDependencyMap;
    exportMap?: ProviderExportMap;
    exports?: Record<string, Provider>;
    outputMap?: ProviderExportMap;
    build?: (
      builder: GeneratorTaskOutputBuilder,
      deps: Record<string, Provider>,
    ) => // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- allow no returns for build
    | void
      | Record<string, unknown>
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- allow no returns for build
      | Promise<void | Record<string, unknown>>;
    generatorName?: string;
    phase?: TaskPhase;
    run?: (deps: Record<string, Provider>) => void;
  } = {},
): GeneratorEntry {
  const {
    id,
    build = () => {
      /*void*/
    },
    children = [],
    exports: entryExports = {},
    dependencyMap = {},
    exportMap = {},
    outputMap = {},
    phase,
    run,
  } = options;
  return buildTestGeneratorEntry(
    {
      id,
      children,
      generatorInfo: {
        name: options.generatorName ?? 'test-generator',
        baseDirectory: '/',
      },
    },
    {
      ...(id && { id: `${id}#main` }),
      dependencies: dependencyMap,
      exports: exportMap,
      outputs: outputMap,
      phase,
      run: (deps) => {
        run?.(deps);
        return {
          providers: entryExports,
          build: (builder) => build(builder, deps) as undefined,
        };
      },
    },
  );
}

describe('executeGeneratorEntry', () => {
  it('generates an empty generator entry', async () => {
    const entry = buildGeneratorEntry();
    const result = await executeGeneratorEntry(entry, { logger });
    expect(result.files.size).toEqual(0);
    expect(result.postWriteCommands.length).toEqual(0);
  });

  it('generates a simple entry', async () => {
    const entry = buildGeneratorEntry({
      generatorName: 'test-generator',
      build: (builder) => {
        builder.writeFile({
          id: 'simple',
          destination: '/simple/file.txt',
          contents: 'simple',
        });
        builder.addPostWriteCommand('simple command', {
          priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
        });
      },
    });
    const result = await executeGeneratorEntry(entry, { logger });
    expect(Object.fromEntries(result.files.entries())).toEqual({
      '/simple/file.txt': {
        id: 'test-generator:simple',
        contents: 'simple',
        options: undefined,
      },
    });
    expect(result.postWriteCommands).toEqual([
      {
        command: 'simple command',
        options: {
          priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
        },
      },
    ]);
  });

  it('adds the task ID to the context', async () => {
    let runTaskId: string | undefined;
    let buildTaskId: string | undefined;
    const entry = buildGeneratorEntry({
      id: 'test-generator',
      generatorName: 'test-generator',
      build: () => {
        buildTaskId = getRunnerContext()?.taskId;
      },
      run: () => {
        runTaskId = getRunnerContext()?.taskId;
      },
    });
    await executeGeneratorEntry(entry, { logger });
    expect(runTaskId).toEqual('test-generator#main');
    expect(buildTaskId).toEqual('test-generator#main');
  });

  it('generates a nested entry', async () => {
    const simpleProviderType = createProviderType('simple');
    const simpleProvider = { hello: vi.fn() };
    const entry = buildGeneratorEntry({
      id: 'root',
      exportMap: {
        simpleExp: simpleProviderType.export(),
      },
      generatorName: 'test-generator',
      exports: { simpleExp: simpleProvider },
      build: (builder) => {
        builder.writeFile({
          id: 'simple',
          destination: '/simple/file.txt',
          contents: 'simple',
        });
        builder.addPostWriteCommand('simple command', {
          priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
        });
      },
      children: [
        buildGeneratorEntry({
          id: 'root:nested',
          dependencyMap: { simpleDep: simpleProviderType },
          generatorName: 'nested-generator',
          build: (builder, deps) => {
            (deps.simpleDep as { hello: () => void }).hello();
            builder.writeFile({
              id: 'nested',
              destination: '/nested/file.txt',
              contents: 'nested',
            });
            builder.addPostWriteCommand('nested command', {
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
              workingDirectory: '/nested',
            });
            builder.addPostWriteCommand('nested command 2', {
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
              workingDirectory: '/nested',
            });
          },
        }),
      ],
    });
    const result = await executeGeneratorEntry(entry, { logger });
    expect(Object.fromEntries(result.files.entries())).toEqual({
      '/simple/file.txt': {
        id: 'test-generator:simple',
        contents: 'simple',
        options: undefined,
      },
      '/nested/file.txt': {
        id: 'nested-generator:nested',
        contents: 'nested',
      },
    });
    expect(result.postWriteCommands).toEqual([
      {
        command: 'nested command',
        options: {
          priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
          workingDirectory: '/nested',
        },
      },
      {
        command: 'nested command 2',
        options: {
          priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
          workingDirectory: '/nested',
        },
      },
      {
        command: 'simple command',
        options: {
          priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
        },
      },
    ]);
    expect(simpleProvider.hello).toHaveBeenCalled();
  });

  it('handles output providers correctly', async () => {
    const outputProviderType = createReadOnlyProviderType<{
      generate: () => void;
    }>('output-provider');
    const outputProvider = { generate: vi.fn() };
    const entry = buildGeneratorEntry({
      id: 'root',
      outputMap: {
        outputProv: outputProviderType.export(),
      },
      build: (builder) => {
        builder.writeFile({
          id: 'output',
          destination: '/output/file.txt',
          contents: 'output',
        });
        return { outputProv: outputProvider };
      },
      children: [
        buildGeneratorEntry({
          id: 'root:consumer',
          dependencyMap: { outputDep: outputProviderType },
          build: (builder, deps) => {
            (deps.outputDep as { generate: () => void }).generate();
            builder.writeFile({
              id: 'consumer',
              destination: '/consumer/file.txt',
              contents: 'consumer',
            });
          },
        }),
      ],
    });

    const result = await executeGeneratorEntry(entry, { logger });
    expect(Object.fromEntries(result.files.entries())).toEqual({
      '/output/file.txt': {
        id: 'test-generator:output',
        contents: 'output',
        options: undefined,
      },
      '/consumer/file.txt': {
        id: 'test-generator:consumer',
        contents: 'consumer',
        options: undefined,
      },
    });
    expect(outputProvider.generate).toHaveBeenCalled();
  });

  it('handles multiple exports and dependencies correctly', async () => {
    const providerTypeA = createProviderType('provider-a');
    const providerTypeB = createProviderType('provider-b');
    const providerA = { methodA: vi.fn() };
    const providerB = { methodB: vi.fn() };

    const entry = buildGeneratorEntry({
      id: 'root',
      exportMap: {
        provA: providerTypeA.export(),
        provB: providerTypeB.export(),
      },
      exports: {
        provA: providerA,
        provB: providerB,
      },
      children: [
        buildGeneratorEntry({
          id: 'root:consumer',
          generatorName: 'test-generator',
          dependencyMap: {
            depA: providerTypeA,
            depB: providerTypeB,
          },
          build: (builder, deps) => {
            (deps.depA as { methodA: () => void }).methodA();
            (deps.depB as { methodB: () => void }).methodB();
            builder.writeFile({
              id: 'consumer',
              destination: '/consumer/file.txt',
              contents: 'consumer',
            });
          },
        }),
      ],
    });

    const result = await executeGeneratorEntry(entry, { logger });
    expect(Object.fromEntries(result.files.entries())).toEqual({
      '/consumer/file.txt': {
        id: 'test-generator:consumer',
        contents: 'consumer',
        options: undefined,
      },
    });
    expect(providerA.methodA).toHaveBeenCalled();
    expect(providerB.methodB).toHaveBeenCalled();
  });

  it('throws error when required provider is not exported', async () => {
    const providerType = createProviderType('missing-provider');
    const entry = buildGeneratorEntry({
      id: 'root',
      children: [
        buildGeneratorEntry({
          id: 'root:consumer',
          dependencyMap: { dep: providerType },
          build: () => {
            /*void*/
          },
        }),
      ],
    });

    await expect(executeGeneratorEntry(entry, { logger })).rejects.toThrow(
      /Could not resolve dependency/,
    );
  });

  it('handles phased task execution correctly', async () => {
    const mainOutputProviderType = createReadOnlyProviderType<{
      generate: () => void;
    }>('main-output-provider');
    const mainOutputProvider = { generate: vi.fn() };
    const phase1OutputProviderType = createReadOnlyProviderType<{
      generate: () => void;
    }>('phase1-output-provider');
    const phase1OutputProvider = { generate: vi.fn() };
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#main-phase',
          name: 'main-phase',
          task: {
            outputs: {
              mainOutputProv: mainOutputProviderType.export(),
            },
            run: () => ({
              providers: {},
              build: () => ({ mainOutputProv: mainOutputProvider }),
            }),
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#phase1',
          name: 'phase1',
          task: {
            phase: phase1,
            dependencies: {
              mainOutputDep: mainOutputProviderType,
            },
            outputs: {
              phase1OutputProv: phase1OutputProviderType.export(),
            },
            run: (deps) => ({
              providers: {},
              build: (builder) => {
                (deps.mainOutputDep as { generate: () => void }).generate();
                builder.writeFile({
                  id: 'phase1',
                  destination: '/phase1/file.txt',
                  contents: 'phase1',
                });
                return { phase1OutputProv: phase1OutputProvider };
              },
            }),
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#phase2',
          name: 'phase2',
          task: {
            phase: phase2,
            dependencies: { phase1OutputDep: phase1OutputProviderType },
            run: (deps) => ({
              providers: {},
              build: (builder) => {
                (deps.phase1OutputDep as { generate: () => void }).generate();
                builder.writeFile({
                  id: 'phase2',
                  destination: '/phase2/file.txt',
                  contents: 'phase2',
                });
              },
            }),
          },
        }),
      ],
    });

    const result = await executeGeneratorEntry(entry, { logger });
    expect(Object.fromEntries(result.files.entries())).toEqual({
      '/phase1/file.txt': {
        id: 'test-generator:phase1',
        contents: 'phase1',
        options: undefined,
      },
      '/phase2/file.txt': {
        id: 'test-generator:phase2',
        contents: 'phase2',
        options: undefined,
      },
    });
    expect(mainOutputProvider.generate).toHaveBeenCalled();
    expect(phase1OutputProvider.generate).toHaveBeenCalled();
  });

  it('throws error when non-output provider is used across phases', async () => {
    const providerType = createProviderType('regular-provider');
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#phase1',
          task: {
            phase: phase1,
            exports: {
              prov: providerType.export(),
            },
            run: () => ({
              providers: { prov: {} },
              build: () => ({}),
            }),
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#phase2',
          task: {
            phase: phase2,
            dependencies: { dep: providerType },
            run: () => ({
              providers: {},
              build: () => ({}),
            }),
          },
        }),
      ],
    });

    await expect(executeGeneratorEntry(entry, { logger })).rejects.toThrow(
      /Dependency dep in root#phase2 cannot come from a previous phase since it is not read-only/,
    );
  });

  it('handles dynamic tasks correctly', async () => {
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#main',
          generatorId: 'root',
          name: 'main',
          task: {
            run: () => ({
              providers: {},
              build: (builder) => {
                builder.addDynamicTask('dynamic-task', {
                  phase: phase1,
                  dependencies: {},
                  run: () => ({
                    providers: {},
                    build: (builder: GeneratorTaskOutputBuilder) => {
                      builder.writeFile({
                        id: 'dynamic',
                        destination: '/dynamic/file.txt',
                        contents: 'dynamic',
                      });
                    },
                  }),
                });
              },
            }),
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#phase1',
          generatorId: 'root',
          name: 'phase1',
          task: {
            phase: phase1,
            run: () => ({
              providers: {},
              build: (builder: GeneratorTaskOutputBuilder) => {
                builder.writeFile({
                  id: 'phase1',
                  destination: '/phase1/file.txt',
                  contents: 'phase1',
                });
              },
            }),
          },
        }),
      ],
    });

    const result = await executeGeneratorEntry(entry, { logger });
    expect(Object.fromEntries(result.files.entries())).toEqual({
      '/dynamic/file.txt': {
        id: 'test-generator:dynamic',
        contents: 'dynamic',
        options: undefined,
      },
      '/phase1/file.txt': {
        id: 'test-generator:phase1',
        contents: 'phase1',
        options: undefined,
      },
    });
  });

  it('throws error when dynamic task has no phase', async () => {
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#main',
          name: 'main',
          task: {
            run: () => ({
              providers: {},
              build: (builder: GeneratorTaskOutputBuilder) => {
                builder.addDynamicTask('dynamic-task', {
                  dependencies: {},
                  run: () => ({
                    providers: {},
                    build: () => ({}),
                  }),
                });
              },
            }),
          },
        }),
      ],
    });

    await expect(executeGeneratorEntry(entry, { logger })).rejects.toThrow(
      /Dynamic task dynamic-task must have a phase/,
    );
  });

  it('throws error when dynamic task has duplicate name', async () => {
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#main',
          generatorId: 'root',
          name: 'main',
          task: {
            run: () => ({
              providers: {},
              build: (builder: GeneratorTaskOutputBuilder) => {
                builder.addDynamicTask('dynamic-task', {
                  phase: phase1,
                  dependencies: {},
                  run: () => ({
                    providers: {},
                    build: () => ({}),
                  }),
                });
                builder.addDynamicTask('dynamic-task', {
                  phase: phase1,
                  dependencies: {},
                  run: () => ({
                    providers: {},
                    build: () => ({}),
                  }),
                });
              },
            }),
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#phase1',
          generatorId: 'root',
          name: 'phase1',
          task: {
            phase: phase1,
            run: () => ({
              providers: {},
              build: (builder) => {
                builder.writeFile({
                  id: 'phase1',
                  destination: '/phase1/file.txt',
                  contents: 'phase1',
                });
              },
            }),
          },
        }),
      ],
    });

    await expect(executeGeneratorEntry(entry, { logger })).rejects.toThrow(
      /Dynamic task dynamic-task already exists/,
    );
  });

  it('handles dynamic tasks with dependencies correctly', async () => {
    const outputProviderType = createReadOnlyProviderType<{
      generate: () => void;
    }>('output-provider');
    const outputProvider = { generate: vi.fn() };
    const entry = buildTestGeneratorEntry({
      id: 'root',
      tasks: [
        buildTestGeneratorTaskEntry({
          id: 'root#main',
          generatorId: 'root',
          name: 'main',
          task: {
            outputs: {
              outputProv: outputProviderType.export(),
            },
            run: () => ({
              providers: {},
              build: (builder: GeneratorTaskOutputBuilder) => {
                builder.addDynamicTask('dynamic-task', {
                  phase: phase1,
                  dependencies: { dep: outputProviderType },
                  run: (deps: Record<string, Provider>) => ({
                    providers: {},
                    build: (builder: GeneratorTaskOutputBuilder) => {
                      (deps.dep as { generate: () => void }).generate();
                      builder.writeFile({
                        id: 'dynamic',
                        destination: '/dynamic/file.txt',
                        contents: 'dynamic',
                      });
                    },
                  }),
                });
                return { outputProv: outputProvider };
              },
            }),
          },
        }),
        buildTestGeneratorTaskEntry({
          id: 'root#phase1',
          generatorId: 'root',
          name: 'phase1',
          task: {
            phase: phase1,
            run: () => ({
              providers: {},
              build: (builder: GeneratorTaskOutputBuilder) => {
                builder.writeFile({
                  id: 'phase1',
                  destination: '/phase1/file.txt',
                  contents: 'phase1',
                });
              },
            }),
          },
        }),
      ],
    });

    const result = await executeGeneratorEntry(entry, { logger });
    expect(Object.fromEntries(result.files.entries())).toEqual({
      '/dynamic/file.txt': {
        id: 'test-generator:dynamic',
        contents: 'dynamic',
        options: undefined,
      },
      '/phase1/file.txt': {
        id: 'test-generator:phase1',
        contents: 'phase1',
        options: undefined,
      },
    });
    expect(outputProvider.generate).toHaveBeenCalled();
  });
});
