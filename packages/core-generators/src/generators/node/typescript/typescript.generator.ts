import type {
  BuilderAction,
  GeneratorInfo,
  InferProviderType,
  WriteFileOptions,
} from '@halfdomelabs/sync';

import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
  normalizePathToProjectPath,
} from '@halfdomelabs/sync';
import { safeMergeAll } from '@halfdomelabs/utils';
import path from 'node:path';
import { z } from 'zod';

import type { CopyTypescriptFilesOptions } from '@src/actions/copy-typescript-files-action.js';
import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
  TsTemplateFile,
  TsTemplateGroup,
} from '@src/renderers/typescript/index.js';

import { copyTypescriptFilesAction } from '@src/actions/copy-typescript-files-action.js';
import { CORE_PACKAGES } from '@src/constants/core-packages.js';
import { projectScope } from '@src/providers/scopes.js';
import { renderTsTemplateFileAction } from '@src/renderers/typescript/actions/render-ts-template-file-action.js';
import {
  extractTsTemplateFileInputsFromTemplateGroup,
  generatePathMapEntries,
  getProjectRelativePathFromModuleSpecifier,
  normalizeModuleSpecifier,
  pathMapEntriesToRegexes,
  renderTsTemplateGroupAction,
} from '@src/renderers/typescript/index.js';
import { extractPackageVersions } from '@src/utils/extract-packages.js';

import type { CopyTypescriptFileOptions } from '../../../actions/index.js';
import type { PathMapEntry } from '../../../writers/typescript/imports.js';
import type {
  TypescriptSourceFileOptions,
  TypescriptTemplateConfigOrEntry,
} from '../../../writers/typescript/source-file.js';
import type { TypescriptCompilerOptions } from './compiler-types.js';

import { copyTypescriptFileAction } from '../../../actions/index.js';
import {
  type TypescriptCodeBlock,
  writeJsonToBuilder,
} from '../../../writers/index.js';
import { resolveModule } from '../../../writers/typescript/imports.js';
import { TypescriptSourceFile } from '../../../writers/typescript/source-file.js';
import {
  createNodePackagesTask,
  nodeProvider,
} from '../node/node.generator.js';

const typescriptGeneratorDescriptorSchema = z.object({});

export interface TypescriptConfigReference {
  path: string;
}

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
}

export const typescriptProvider =
  createProviderType<TypescriptProvider>('typescript');

interface LazyTemplateFileEntry {
  payload: RenderTsTemplateFileActionInput & {
    generatorInfo: GeneratorInfo;
  };
  /**
   * The dev packages to add if the template is written
   */
  devPackages?: Record<string, string>;
  /**
   * The prod packages to add if the template is written
   */
  prodPackages?: Record<string, string>;
}

export interface TypescriptFileProvider {
  /**
   * Adds a lazy template file that will be written only if
   * another template depends on it.
   *
   * @param payload - The payload for the template file
   * @param generatorInfo - The generator info for the generator that is writing the template file
   * @returns The action for the template file
   */
  addLazyTemplateFile<T extends TsTemplateFile = TsTemplateFile>(
    payload: RenderTsTemplateFileActionInput<T> & {
      generatorInfo: GeneratorInfo;
    },
    options?: Omit<LazyTemplateFileEntry, 'payload'>,
  ): void;
  /**
   * Adds a lazy template group whose files will be written only if
   * another template depends on it.
   *
   * @param payload - The payload for the template group
   * @returns The action for the template group
   */
  addLazyTemplateGroup<T extends TsTemplateGroup = TsTemplateGroup>(
    payload: RenderTsTemplateGroupActionInput<T> & {
      generatorInfo: GeneratorInfo;
    },
    options?: Omit<LazyTemplateFileEntry, 'payload'>,
  ): void;
  /**
   * Renders a template file to an action
   *
   * @param payload - The payload for the template file
   * @returns The action for the template file
   */
  renderTemplateFile<T extends TsTemplateFile = TsTemplateFile>(
    payload: RenderTsTemplateFileActionInput<T>,
  ): BuilderAction;
  /**
   * Renders a template group to an action
   *
   * @param payload - The payload for the template group
   * @returns The action for the template group
   */
  renderTemplateGroup<T extends TsTemplateGroup = TsTemplateGroup>(
    payload: RenderTsTemplateGroupActionInput<T>,
  ): BuilderAction;
  /**
   * Marks an import as used
   *
   * @param projectRelativePath - The project relative path to mark as used
   */
  markImportAsUsed(projectRelativePath: string): void;
}

export const typescriptFileProvider =
  createProviderType<TypescriptFileProvider>('typescript-file');

const DEFAULT_COMPILER_OPTIONS: TypescriptCompilerOptions = {
  outDir: 'dist',
  declaration: true,
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
};

const [setupTask, typescriptSetupProvider, typescriptConfigProvider] =
  createConfigProviderTask(
    (t) => ({
      compilerOptions: t.scalar<TypescriptCompilerOptions>(
        DEFAULT_COMPILER_OPTIONS,
      ),
      include: t.array<string>(['src'], { stripDuplicates: true }),
      exclude: t.array<string>(['**/node_modules', '**/dist', '**/lib']),
      references: t.array<TypescriptConfigReference>(),
      extraSections: t.array<Record<string, unknown>>(),
    }),
    {
      prefix: 'typescript',
      configScope: projectScope,
      configValuesScope: projectScope,
    },
  );

export { typescriptConfigProvider, typescriptSetupProvider };

export type TypescriptConfigProvider = InferProviderType<
  typeof typescriptConfigProvider
>;

export type TypescriptSetupProvider = InferProviderType<
  typeof typescriptSetupProvider
>;

export const typescriptGenerator = createGenerator({
  name: 'node/typescript',
  generatorFileUrl: import.meta.url,
  descriptorSchema: typescriptGeneratorDescriptorSchema,
  buildTasks: () => ({
    setup: createGeneratorTask(setupTask),
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(CORE_PACKAGES, ['typescript']),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptConfig: typescriptConfigProvider,
      },
      exports: { typescript: typescriptProvider.export(projectScope) },
      run({ typescriptConfig }) {
        const { compilerOptions } = typescriptConfig;
        let cachedPathEntries: PathMapEntry[] | undefined;

        function getPathEntries(): PathMapEntry[] {
          if (!cachedPathEntries) {
            const { baseUrl, paths } = compilerOptions;
            if (!paths && (baseUrl === './' || baseUrl === '.')) {
              // TODO: Support other source folders
              cachedPathEntries = [{ from: 'src', to: 'src' }];
            } else if (paths) {
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
                    .join(baseUrl ?? '.', value[0].replace(/\/\*$/, ''))
                    .replace(/^\./, ''),
                  to: key.slice(0, Math.max(0, key.length - 2)),
                };
              });
            } else {
              cachedPathEntries = [];
            }
          }

          return cachedPathEntries;
        }

        const moduleResolution = compilerOptions.moduleResolution ?? 'node';

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
            } as TypescriptProvider,
          },
          build(builder) {
            const { include, exclude, references, extraSections } =
              typescriptConfig;

            writeJsonToBuilder(builder, {
              id: 'tsconfig',
              destination: 'tsconfig.json',
              contents: {
                compilerOptions,
                include,
                exclude,
                references: references.length > 0 ? references : undefined,
                ...safeMergeAll(...extraSections),
              },
            });
          },
        };
      },
    }),
    file: createGeneratorTask({
      dependencies: {
        typescriptConfig: typescriptConfigProvider,
        node: nodeProvider,
      },
      exports: { typescriptFile: typescriptFileProvider.export(projectScope) },
      run({ typescriptConfig: { compilerOptions }, node }) {
        const {
          baseUrl = '.',
          paths = {},
          moduleResolution = 'node',
        } = compilerOptions;
        const pathMapEntries = generatePathMapEntries(baseUrl, paths);
        const internalPatterns = pathMapEntriesToRegexes(pathMapEntries);

        const lazyTemplates = new Set<LazyTemplateFileEntry>();
        const usedProjectRelativePaths = new Set<string>();

        function resolveModuleSpecifier(
          moduleSpecifier: string,
          directory: string,
        ): string {
          const projectRelativePath = getProjectRelativePathFromModuleSpecifier(
            moduleSpecifier,
            directory,
          );
          if (projectRelativePath) {
            // use path without extension for improved matching
            usedProjectRelativePaths.add(
              projectRelativePath.replace(/\.(j|t)sx?$/, ''),
            );
          }
          return normalizeModuleSpecifier(moduleSpecifier, directory, {
            pathMapEntries,
            moduleResolution,
          });
        }

        const sharedRenderOptions = {
          importSortOptions: {
            groups: [
              'builtin',
              'external',
              'internal',
              ['parent', 'sibling'],
              'index',
            ] as const,
            internalPatterns,
          },
        };

        function renderTemplateFile(
          payload: RenderTsTemplateFileActionInput,
        ): BuilderAction {
          const directory = path.dirname(
            normalizePathToProjectPath(payload.destination),
          );
          return renderTsTemplateFileAction({
            ...payload,
            renderOptions: {
              resolveModule(moduleSpecifier) {
                return resolveModuleSpecifier(moduleSpecifier, directory);
              },
              ...sharedRenderOptions,
            },
          });
        }

        return {
          providers: {
            typescriptFile: {
              addLazyTemplateFile: (payload, options) => {
                lazyTemplates.add({
                  payload,
                  ...options,
                });
              },
              addLazyTemplateGroup: (payload, options) => {
                // break out files of the group
                const files =
                  extractTsTemplateFileInputsFromTemplateGroup(payload);
                for (const file of files) {
                  lazyTemplates.add({
                    payload: {
                      ...file,
                      generatorInfo: payload.generatorInfo,
                    },
                    ...options,
                  });
                }
              },
              renderTemplateFile,
              renderTemplateGroup: (payload) =>
                renderTsTemplateGroupAction({
                  ...payload,
                  renderOptions: {
                    resolveModule(moduleSpecifier, sourceDirectory) {
                      return resolveModuleSpecifier(
                        moduleSpecifier,
                        sourceDirectory,
                      );
                    },
                    ...sharedRenderOptions,
                  },
                }),
              markImportAsUsed: (projectRelativePath) => {
                usedProjectRelativePaths.add(
                  projectRelativePath.replace(/\.(j|t)sx?$/, ''),
                );
              },
            },
          },
          async build(builder) {
            while (lazyTemplates.size > 0) {
              const templatesToRender = [...lazyTemplates].filter((template) =>
                usedProjectRelativePaths.has(
                  normalizePathToProjectPath(
                    template.payload.destination,
                  ).replace(/\.(j|t)sx?$/, ''),
                ),
              );
              if (templatesToRender.length === 0) {
                break;
              }
              for (const template of templatesToRender) {
                await builder.apply(renderTemplateFile(template.payload));
                if (template.devPackages || template.prodPackages) {
                  node.packages.addPackages({
                    dev: template.devPackages,
                    prod: template.prodPackages,
                  });
                }
                lazyTemplates.delete(template);
              }
            }
          },
        };
      },
    }),
  }),
});

export { type TypescriptCompilerOptions } from './compiler-types.js';
