import { describe, expect, it, vi } from 'vitest';
import { formatterProvider } from '@src/providers/index.js';
import { createEventedLogger } from '@src/utils/index.js';
import { GeneratorOutputBuilder } from '../generator-output.js';
import { ProviderDependencyMap, ProviderExportMap } from '../generator.js';
import { createProviderType, Provider } from '../provider.js';
import { GeneratorEntry } from './generator-builder.js';
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
      builder: GeneratorOutputBuilder,
      deps: Record<string, Provider>
    ) => void;
  } = {}
): GeneratorEntry {
  const {
    id,
    build = () => {},
    children = [],
    exports = {},
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
          getProviders: () => exports,
          build: (builder) => build(builder, deps),
        }),
      },
    }
  );
}

describe('executeGeneratorEntry', () => {
  it('generates an empty generator entry', async () => {
    const entry = buildGeneratorEntry();
    const result = await executeGeneratorEntry(entry, logger);
    expect(result).toEqual({
      files: {},
      postWriteCommands: [],
    });
  });

  it('generates a simple entry', async () => {
    const entry = buildGeneratorEntry({
      build: (builder) => {
        builder.writeFile('/simple/file.txt', 'simple');
        builder.addPostWriteCommand('simple command');
      },
    });
    const result = await executeGeneratorEntry(entry, logger);
    expect(result).toEqual({
      files: {
        '/simple/file.txt': {
          contents: 'simple',
          formatter: undefined,
        },
      },
      postWriteCommands: [{ command: 'simple command' }],
    });
  });

  it('generates a nested entry', async () => {
    const formatter = { format: vi.fn() };
    const simpleProviderType = createProviderType('simple');
    const simpleProvider = { hello: vi.fn() };
    const entry = buildGeneratorEntry({
      id: 'root',
      exportMap: {
        formatter: formatterProvider,
        simpleExp: simpleProviderType,
      },
      exports: { formatter, simpleExp: simpleProvider },
      build: (builder) => {
        builder.writeFile('/simple/file.txt', 'simple');
        builder.addPostWriteCommand('simple command');
      },
      children: [
        buildGeneratorEntry({
          id: 'root:nested',
          dependencyMap: { simpleDep: simpleProviderType },
          build: (builder, deps) => {
            deps.simpleDep.hello();
            builder.writeFile('/nested/file.txt', 'nested', {
              shouldFormat: true,
            });
            builder.addPostWriteCommand('nested command', {
              workingDirectory: '/nested',
            });
            builder.addPostWriteCommand('nested command 2');
          },
        }),
      ],
    });
    const result = await executeGeneratorEntry(entry, logger);
    expect(result).toEqual({
      files: {
        '/simple/file.txt': {
          contents: 'simple',
          formatter: undefined,
          options: undefined,
        },
        '/nested/file.txt': {
          contents: 'nested',
          formatter,
          options: { shouldFormat: true },
        },
      },
      postWriteCommands: [
        { command: 'nested command', options: { workingDirectory: '/nested' } },
        { command: 'nested command 2', options: undefined },
        { command: 'simple command', options: undefined },
      ],
    });
    expect(simpleProvider.hello).toHaveBeenCalled();
  });
});
