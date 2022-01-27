import { formatterProvider } from '@src/providers';
import { ProviderDependencyMap, ProviderExportMap } from '../generator';
import { GeneratorOutputBuilder } from '../generator-output';
import { Provider, createProviderType } from '../provider';
import { GeneratorEntry } from './generator-builder';
import { executeGeneratorEntry } from './generator-runner';
import { buildTestGeneratorEntry } from './tests/factories.test-helper';

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
    dependencyMap,
    exportMap,
  } = options;
  return buildTestGeneratorEntry({
    id,
    dependencies: dependencyMap,
    exports: exportMap,
    generatorConfig: {
      configBaseDirectory: '/',
      parseDescriptor: jest.fn(),
      createGenerator: (descriptor, deps) => ({
        getProviders: () => exports,
        build: (builder) => build(builder, deps),
      }),
    },
    children,
  });
}

describe('executeGeneratorEntry', () => {
  it('generates an empty generator entry', async () => {
    const entry = buildGeneratorEntry();
    const result = await executeGeneratorEntry(entry);
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
    const result = await executeGeneratorEntry(entry);
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
    const formatter = { format: jest.fn() };
    const simpleProviderType = createProviderType('simple');
    const simpleProvider = { hello: jest.fn() };
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
    const result = await executeGeneratorEntry(entry);
    expect(result).toEqual({
      files: {
        '/simple/file.txt': {
          contents: 'simple',
          formatter: undefined,
        },
        '/nested/file.txt': {
          contents: 'nested',
          formatter,
        },
      },
      postWriteCommands: [
        { command: 'simple command', options: undefined },
        { command: 'nested command', options: { workingDirectory: '/nested' } },
        { command: 'nested command 2', options: undefined },
      ],
    });
    expect(simpleProvider.hello).toHaveBeenCalled();
  });
});
