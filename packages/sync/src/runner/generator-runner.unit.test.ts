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

import { createProviderType } from '../providers/index.js';
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
    build?: (
      builder: GeneratorTaskOutputBuilder,
      deps: Record<string, Provider>,
    ) => void;
  } = {},
): GeneratorEntry {
  const {
    id,
    build = () => {
      /* empty */
    },
    children = [],
    exports: entryExports = {},
    dependencyMap = {},
    exportMap = {},
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
      task: {
        name: 'main',
        dependencies: dependencyMap,
        exports: exportMap,
        taskDependencies: [],
        run: (deps) => ({
          providers: entryExports,
          build: (builder) => {
            build(builder, deps);
          },
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
        id: 'simple',
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
          build: (builder, deps) => {
            deps.simpleDep.hello();
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
        id: 'simple',
        contents: 'simple',
        options: undefined,
      },
      '/nested/file.txt': {
        id: 'nested',
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
});
