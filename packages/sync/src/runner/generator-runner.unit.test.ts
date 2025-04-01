import { describe, expect, it, vi } from 'vitest';

import type { GeneratorTaskOutputBuilder } from '@src/output/generator-task-output.js';

import { POST_WRITE_COMMAND_PRIORITY } from '@src/output/post-write-commands/types.js';
import { createEventedLogger } from '@src/utils/index.js';

import type {
  GeneratorEntry,
  ProviderDependencyMap,
  ProviderExportMap,
} from '../generators/index.js';
import type { Provider } from '../providers/index.js';

import {
  createOutputProviderType,
  createProviderType,
} from '../providers/index.js';
import { executeGeneratorEntry } from './generator-runner.js';
import { buildTestGeneratorEntry } from './tests/factories.test-helper.js';

const logger = createEventedLogger({ noConsole: true });

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
  } = options;
  return buildTestGeneratorEntry(
    {
      id,
      children,
    },
    {
      ...(id && { id: `${id}#main` }),
      dependencies: dependencyMap,
      exports: exportMap,
      outputs: outputMap,
      generatorName: options.generatorName,
      task: {
        name: 'main',
        dependencies: dependencyMap,
        exports: exportMap,
        outputs: outputMap,
        run: (deps) => ({
          providers: entryExports,
          build: (builder) => build(builder, deps) as undefined,
        }),
      },
    },
  );
}

describe('executeGeneratorEntry', () => {
  it('generates an empty generator entry', async () => {
    const entry = buildGeneratorEntry();
    const result = await executeGeneratorEntry(entry, logger);
    expect(result.files.size).toEqual(0);
    expect(result.postWriteCommands.length).toEqual(0);
  });

  it('generates a simple entry', async () => {
    const entry = buildGeneratorEntry({
      generatorName: 'test-generator',
      build: (builder) => {
        builder.writeFile({
          id: 'simple',
          filePath: '/simple/file.txt',
          contents: 'simple',
        });
        builder.addPostWriteCommand('simple command', {
          priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
        });
      },
    });
    const result = await executeGeneratorEntry(entry, logger);
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
          filePath: '/simple/file.txt',
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
              filePath: '/nested/file.txt',
              contents: 'nested',
              options: {
                shouldFormat: true,
              },
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
    const result = await executeGeneratorEntry(entry, logger);
    expect(Object.fromEntries(result.files.entries())).toEqual({
      '/simple/file.txt': {
        id: 'test-generator:simple',
        contents: 'simple',
        options: undefined,
      },
      '/nested/file.txt': {
        id: 'nested-generator:nested',
        contents: 'nested',
        options: { shouldFormat: true },
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
    const outputProviderType = createOutputProviderType<{
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
          filePath: '/output/file.txt',
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
              filePath: '/consumer/file.txt',
              contents: 'consumer',
            });
          },
        }),
      ],
    });

    const result = await executeGeneratorEntry(entry, logger);
    expect(Object.fromEntries(result.files.entries())).toEqual({
      '/output/file.txt': {
        id: 'simple:output',
        contents: 'output',
        options: undefined,
      },
      '/consumer/file.txt': {
        id: 'simple:consumer',
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
              filePath: '/consumer/file.txt',
              contents: 'consumer',
            });
          },
        }),
      ],
    });

    const result = await executeGeneratorEntry(entry, logger);
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

    await expect(executeGeneratorEntry(entry, logger)).rejects.toThrow(
      /Could not resolve dependency/,
    );
  });
});
