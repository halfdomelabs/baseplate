import type {
  BuilderAction,
  NonOverwriteableMap,
  WriteFileOptions,
} from '@halfdomelabs/sync';
import type { CompilerOptions } from 'ts-morph';

import {
  createGenerator,
  createNonOverwriteableMap,
  createProviderType,
  writeJsonAction,
} from '@halfdomelabs/sync';
import { safeMergeAll } from '@halfdomelabs/utils';
import path from 'node:path';
import { ts } from 'ts-morph';
import { z } from 'zod';

import type { CopyTypescriptFilesOptions } from '@src/actions/copy-typescript-files-action.js';
import type {
  InferTsCodeTemplateVariablesFromMap,
  TsCodeFileTemplate,
  TsCodeTemplateVariableMap,
} from '@src/renderers/typescript/index.js';

import { copyTypescriptFilesAction } from '@src/actions/copy-typescript-files-action.js';
import { CORE_PACKAGES } from '@src/constants/core-packages.js';
import { projectScope } from '@src/providers/scopes.js';
import {
  generatePathMapEntries,
  pathMapEntriesToRegexes,
  renderTsCodeFileTemplate,
} from '@src/renderers/typescript/index.js';

import type { CopyTypescriptFileOptions } from '../../../actions/index.js';
import type { TypescriptCodeBlock } from '../../../writers/index.js';
import type { PathMapEntry } from '../../../writers/typescript/imports.js';
import type {
  TypescriptSourceFileOptions,
  TypescriptTemplateConfigOrEntry,
} from '../../../writers/typescript/source-file.js';

import { copyTypescriptFileAction } from '../../../actions/index.js';
import { resolveModule } from '../../../writers/typescript/imports.js';
import { TypescriptSourceFile } from '../../../writers/typescript/source-file.js';
import { nodeProvider } from '../node/index.js';

type ChangePropertyTypes<
  T,
  Substitutions extends {
    [K in keyof T]?: unknown;
  },
> = {
  [K in keyof T]: K extends keyof Substitutions ? Substitutions[K] : T[K];
};

type ModuleResolutionKind = ts.server.protocol.ModuleResolutionKind;
type ModuleKind = ts.server.protocol.ModuleKind;
type ScriptTarget = ts.server.protocol.ScriptTarget;
type JsxEmit = ts.server.protocol.JsxEmit;

type TypescriptCompilerOptions = ChangePropertyTypes<
  CompilerOptions,
  {
    moduleResolution?: `${ModuleResolutionKind}`;
    module?: `${ModuleKind}`;
    target?: `${ScriptTarget}`;
    jsx?: `${JsxEmit}`;
  }
>;

const typescriptGeneratorDescriptorSchema = z.object({
  includeMetadata: z.boolean().optional(),
});

export interface TypescriptConfigReference {
  path: string;
}

export interface TypescriptConfigProvider {
  setTypescriptVersion(version: string): void;
  setTypescriptCompilerOptions(json: TypescriptCompilerOptions): void;
  getCompilerOptions(): CompilerOptions;
  addInclude(path: string): void;
  addExclude(path: string): void;
  addReference(reference: TypescriptConfigReference): void;
  addExtraSection(section: Record<string, unknown>): void;
}

export const typescriptConfigProvider =
  createProviderType<TypescriptConfigProvider>('typescript-config');

export interface TypescriptProvider {
  createTemplate<Config extends TypescriptTemplateConfigOrEntry>(
    config: Config,
    options?: Omit<
      TypescriptSourceFileOptions,
      'pathMappings' | 'moduleResolution'
    >,
  ): TypescriptSourceFile<Config>;
  createCopyFilesAction(
    options: Omit<
      CopyTypescriptFilesOptions,
      'pathMappings' | 'moduleResolution'
    >,
  ): ReturnType<typeof copyTypescriptFilesAction>;
  createCopyAction(
    options: Omit<
      CopyTypescriptFileOptions,
      'pathMappings' | 'moduleResolution'
    >,
  ): ReturnType<typeof copyTypescriptFileAction>;
  renderBlockToAction(
    block: TypescriptCodeBlock,
    destination: string,
    options?: WriteFileOptions,
  ): BuilderAction;
  resolveModule(moduleSpecifier: string, from: string): string;
  getCompilerOptions(): CompilerOptions;
}

export const typescriptProvider =
  createProviderType<TypescriptProvider>('typescript');

interface WriteTemplatedFilePayload<
  TVariables extends TsCodeTemplateVariableMap,
> {
  template: TsCodeFileTemplate<TVariables>;
  destination: string;
  variables: InferTsCodeTemplateVariablesFromMap<TVariables>;
  fileId: string;
  generatorName: string;
  options?: WriteFileOptions;
}

export interface TypescriptFileProvider {
  writeTemplatedFile<TVariables extends TsCodeTemplateVariableMap>(
    payload: WriteTemplatedFilePayload<TVariables>,
  ): void;
}

export const typescriptFileProvider =
  createProviderType<TypescriptFileProvider>('typescript-file');

interface TypescriptConfig {
  version: string;
  compilerOptions: TypescriptCompilerOptions;
  include: string[];
  exclude: string[];
  references: TypescriptConfigReference[];
  extraSections: Record<string, unknown>[];
}

const DEFAULT_CONFIG: TypescriptConfig = {
  version: CORE_PACKAGES.typescript,
  compilerOptions: {
    outDir: 'dist',
    declaration: true,
    baseUrl: './src',
    target: 'es2022',
    lib: ['es2023'],
    esModuleInterop: true,
    module: 'node16',
    moduleResolution: 'node16',
    strict: true,
    removeComments: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    sourceMap: true,
  },
  include: ['src'],
  exclude: ['**/node_modules', '**/dist', '**/lib'],
  references: [],
  extraSections: [],
};

export const typescriptGenerator = createGenerator({
  name: 'node/typescript',
  generatorFileUrl: import.meta.url,
  descriptorSchema: typescriptGeneratorDescriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    const configTask = taskBuilder.addTask({
      name: 'config',
      exports: {
        typescriptConfig: typescriptConfigProvider.export(projectScope),
      },
      run() {
        const config = createNonOverwriteableMap<TypescriptConfig>(
          DEFAULT_CONFIG,
          {
            name: 'typescript',
            defaultsOverwriteable: true,
          },
        );

        function getCompilerOptions(): CompilerOptions {
          const result = ts.convertCompilerOptionsFromJson(
            config.get('compilerOptions'),
            '.',
          );
          if (result.errors.length > 0) {
            throw new Error(
              `Unable to extract compiler options: ${JSON.stringify(
                result.errors,
              )}`,
            );
          }
          return result.options;
        }

        return {
          providers: {
            typescriptConfig: {
              setTypescriptVersion(version) {
                config.merge({ version });
              },
              setTypescriptCompilerOptions(options) {
                config.merge({ compilerOptions: options });
              },
              getCompilerOptions,
              addInclude(path) {
                config.appendUnique('include', [path]);
              },
              addExclude(path) {
                config.appendUnique('exclude', [path]);
              },
              addReference(reference) {
                config.appendUnique('references', [reference]);
              },
              addExtraSection(section) {
                config.appendUnique('extraSections', [section]);
              },
            },
          },
          build: (
            builder,
            addTaskOutput: (output: {
              config: NonOverwriteableMap<TypescriptConfig>;
              getCompilerOptions: () => CompilerOptions;
            }) => void,
          ) => {
            addTaskOutput({ config, getCompilerOptions });
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'main',
      dependencies: { node: nodeProvider },
      exports: { typescript: typescriptProvider.export(projectScope) },
      taskDependencies: { configTask },
      run({ node }, { configTask: { config, getCompilerOptions } }) {
        let cachedPathEntries: PathMapEntry[] | undefined;

        function getPathEntries(): PathMapEntry[] {
          if (!cachedPathEntries) {
            // { "baseUrl": "./src", "paths": { "@src/*": ["./*"] } }
            // would be { from: "src", to: "@src" }
            const configMap = config.value();

            const { baseUrl, paths } = configMap.compilerOptions;
            if (!paths && (baseUrl === './' || baseUrl === '.')) {
              // TODO: Support other source folders
              cachedPathEntries = [{ from: 'src', to: 'src' }];
            } else if (!paths || !baseUrl) {
              cachedPathEntries = [];
            } else {
              cachedPathEntries = Object.entries(paths).map(([key, value]) => {
                if (value.length !== 1) {
                  throw new Error(
                    'We do not support paths with multiple values',
                  );
                }
                if (!key.endsWith('/*')) {
                  throw new Error('Paths must end in /*');
                }
                return {
                  from: path
                    .join(baseUrl, value[0].replace(/\/\*$/, ''))
                    .replace(/^\./, ''),
                  to: key.slice(0, Math.max(0, key.length - 2)),
                };
              });
            }
          }

          return cachedPathEntries;
        }

        const moduleResolution =
          config.value().compilerOptions.moduleResolution ?? 'node';

        return {
          providers: {
            typescript: {
              createTemplate: (fileConfig, options) =>
                new TypescriptSourceFile(fileConfig, {
                  ...options,
                  pathMappings: getPathEntries(),
                  moduleResolution,
                }),
              createCopyFilesAction: (options) =>
                copyTypescriptFilesAction({
                  ...options,
                  pathMappings: getPathEntries(),
                  moduleResolution,
                }),
              createCopyAction: (options) =>
                copyTypescriptFileAction({
                  ...options,
                  pathMappings: getPathEntries(),
                  moduleResolution,
                }),
              renderBlockToAction: (block, destination, options) => {
                const file = new TypescriptSourceFile(
                  { BLOCK: { type: 'code-block' } },
                  {
                    pathMappings: getPathEntries(),
                    moduleResolution,
                  },
                );
                file.addCodeEntries({ BLOCK: block });
                return file.renderToActionFromText(
                  'BLOCK',
                  destination,
                  options,
                );
              },
              resolveModule: (moduleSpecifier, from) =>
                resolveModule(moduleSpecifier, from, {
                  pathMapEntries: getPathEntries(),
                  moduleResolution,
                }),
              getCompilerOptions,
            } as TypescriptProvider,
          },
          async build(builder) {
            const {
              compilerOptions,
              include,
              exclude,
              version,
              references,
              extraSections,
            } = config.value();
            node.addDevPackage('typescript', version);

            await builder.apply(
              writeJsonAction({
                destination: 'tsconfig.json',
                contents: {
                  compilerOptions,
                  include,
                  exclude,
                  references: references.length > 0 ? references : undefined,
                  ...safeMergeAll(...extraSections),
                },
              }),
            );
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'file',
      exports: {
        typescriptFile: typescriptFileProvider.export(projectScope),
      },
      taskDependencies: { configTask },
      run(_, { configTask: { config } }) {
        const moduleResolution =
          config.value().compilerOptions.moduleResolution ?? 'node';
        const { baseUrl = '.', paths = {} } = config.value().compilerOptions;
        const pathMapEntries = generatePathMapEntries(baseUrl, paths);
        const internalPatterns = pathMapEntriesToRegexes(pathMapEntries);

        const typescriptFiles: WriteTemplatedFilePayload<TsCodeTemplateVariableMap>[] =
          [];

        return {
          providers: {
            typescriptFile: {
              writeTemplatedFile: (payload) => {
                typescriptFiles.push(payload);
              },
            },
          },
          async build(builder) {
            for (const {
              fileId,
              generatorName,
              template,
              destination,
              variables,
              options,
            } of typescriptFiles) {
              const directory = path.dirname(destination);
              const file = await renderTsCodeFileTemplate(template, variables, {
                resolveModule(moduleSpecifier) {
                  return resolveModule(moduleSpecifier, directory, {
                    pathMapEntries,
                    moduleResolution,
                  });
                },
                importSortOptions: {
                  internalPatterns,
                },
                includeMetadata: descriptor.includeMetadata,
              });
              builder.writeFile({
                id: fileId,
                generatorName,
                filePath: destination,
                contents: file,
                options: {
                  ...options,
                  shouldFormat: true,
                },
              });
            }
          },
        };
      },
    });
  },
});
