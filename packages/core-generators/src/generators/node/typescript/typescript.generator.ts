import type {
  BuilderAction,
  GeneratorInfo,
  InferProviderType,
} from '@baseplate-dev/sync';

import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
  normalizePathToOutputPath,
} from '@baseplate-dev/sync';
import { safeMergeAll } from '@baseplate-dev/utils';
import path from 'node:path';
import { z } from 'zod';

import type { RenderTsTemplateGroupActionInput as RenderTsTemplateGroupActionInputV2 } from '#src/renderers/typescript/actions/render-ts-template-group-action.js';
import type {
  RenderTsCodeFileTemplateOptions,
  RenderTsFragmentActionInput,
  RenderTsTemplateFileActionInput,
  TsTemplateFile,
  TsTemplateGroup,
} from '#src/renderers/typescript/index.js';

import { CORE_PACKAGES } from '#src/constants/core-packages.js';
import { packageScope } from '#src/providers/scopes.js';
import { renderTsTemplateFileAction } from '#src/renderers/typescript/actions/render-ts-template-file-action.js';
import {
  extractTsTemplateFileInputsFromTemplateGroup,
  generatePathMapEntries,
  getOutputRelativePathFromModuleSpecifier,
  normalizeModuleSpecifier,
  pathMapEntriesToRegexes,
  renderTsFragmentAction,
  renderTsTemplateGroupAction,
} from '#src/renderers/typescript/index.js';
import { extractPackageVersions } from '#src/utils/extract-packages.js';

import type { TypescriptCompilerOptions } from './compiler-types.js';

import { writeJsonToBuilder } from '../../../writers/index.js';
import {
  createNodePackagesTask,
  createNodeTask,
  nodeProvider,
} from '../node/index.js';

const typescriptGeneratorDescriptorSchema = z.object({});

export interface TypescriptConfigReference {
  path: string;
}

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
    payload: RenderTsTemplateGroupActionInputV2<T> & {
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
  /** Renders a template fragment to an action */
  renderTemplateFragment(payload: RenderTsFragmentActionInput): BuilderAction;
  /**
   * Renders a template group to an action using the new v2 implementation
   * with Record<string, TsTemplateFile> signature
   *
   * @param payload - The payload for the template group
   * @returns The action for the template group
   */
  renderTemplateGroup<
    T extends Record<string, TsTemplateFile> = Record<string, TsTemplateFile>,
  >(
    payload: RenderTsTemplateGroupActionInputV2<T>,
  ): BuilderAction;
  /**
   * Marks an import as used
   *
   * @param outputRelativePath - The output relative path to mark as used
   */
  markImportAsUsed(outputRelativePath: string): void;
  /**
   * Resolves a module specifier to a output relative path
   *
   * @param moduleSpecifier - The module specifier to resolve
   * @param from - The directory to resolve the module from
   * @returns The output relative path
   */
  resolveModuleSpecifier(moduleSpecifier: string, from: string): string;
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

const [setupTask, typescriptSetupProvider, typescriptSetupValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      compilerOptions: t.scalar<TypescriptCompilerOptions>(
        DEFAULT_COMPILER_OPTIONS,
      ),
      include: t.array<string>(['src'], { stripDuplicates: true }),
      exclude: t.array<string>(['**/node_modules', '**/dist', '**/lib']),
      references: t.array<TypescriptConfigReference>(),
      extraSections: t.array<Record<string, unknown>>(),
      tsconfigPath: t.scalar<string>('tsconfig.json'),
    }),
    {
      prefix: 'typescript',
      configScope: packageScope,
      configValuesScope: packageScope,
    },
  );

export { typescriptSetupProvider, typescriptSetupValuesProvider };

export type TypescriptConfigProvider = InferProviderType<
  typeof typescriptSetupValuesProvider
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
    node: createNodeTask((node) => {
      node.scripts.set('typecheck', 'tsc --noEmit');
    }),
    tsconfig: createGeneratorTask({
      dependencies: {
        typescriptConfig: typescriptSetupValuesProvider,
      },
      run({ typescriptConfig }) {
        const { compilerOptions } = typescriptConfig;

        return {
          build(builder) {
            const { include, exclude, references, extraSections } =
              typescriptConfig;

            writeJsonToBuilder(builder, {
              id: 'tsconfig',
              destination: typescriptConfig.tsconfigPath,
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
        typescriptConfig: typescriptSetupValuesProvider,
        node: nodeProvider,
      },
      exports: { typescriptFile: typescriptFileProvider.export(packageScope) },
      run({ typescriptConfig: { compilerOptions }, node }) {
        const {
          baseUrl = '.',
          paths = {},
          moduleResolution = 'node',
        } = compilerOptions;
        const pathMapEntries = generatePathMapEntries(baseUrl, paths);
        const internalPatterns = pathMapEntriesToRegexes(pathMapEntries);

        const lazyTemplates = new Set<LazyTemplateFileEntry>();
        const usedOutputRelativePaths = new Set<string>();

        function resolveModuleSpecifier(
          moduleSpecifier: string,
          directory: string,
        ): string {
          const outputRelativePath = getOutputRelativePathFromModuleSpecifier(
            moduleSpecifier,
            directory,
          );
          if (outputRelativePath) {
            // use path without extension for improved matching
            usedOutputRelativePaths.add(
              outputRelativePath.replace(/\.(j|t)sx?$/, ''),
            );
          }
          return normalizeModuleSpecifier(moduleSpecifier, directory, {
            pathMapEntries,
            moduleResolution,
          });
        }

        const sharedRenderOptions: RenderTsCodeFileTemplateOptions = {
          importSortOptions: {
            groups: [
              ['external-type', 'builtin-type'],
              ['external', 'builtin'],
              'internal-type',
              'internal',
              ['parent-type', 'sibling-type', 'index-type'],
              ['parent', 'sibling', 'index'],
              'unknown',
            ],
            internalPatterns,
          },
        };

        function renderTemplateFile(
          payload: RenderTsTemplateFileActionInput,
        ): BuilderAction {
          const directory = path.dirname(
            normalizePathToOutputPath(payload.destination),
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
              addLazyTemplateGroup(payload, options) {
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
              renderTemplateFragment: (payload) => {
                const directory = path.dirname(
                  normalizePathToOutputPath(payload.destination),
                );
                return renderTsFragmentAction({
                  ...payload,
                  renderOptions: {
                    resolveModule(moduleSpecifier) {
                      return resolveModuleSpecifier(moduleSpecifier, directory);
                    },
                    ...sharedRenderOptions,
                  },
                });
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
              markImportAsUsed: (outputRelativePath) => {
                usedOutputRelativePaths.add(
                  outputRelativePath.replace(/\.(j|t)sx?$/, ''),
                );
              },
              resolveModuleSpecifier,
            },
          },
          async build(builder) {
            while (lazyTemplates.size > 0) {
              const templatesToRender = [...lazyTemplates].filter((template) =>
                usedOutputRelativePaths.has(
                  normalizePathToOutputPath(
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
