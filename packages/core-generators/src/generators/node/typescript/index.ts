import type {
  BuilderAction,
  GeneratorTask,
  InferProviderType,
  WriteFileOptions,
} from '@halfdomelabs/sync';
import type { CompilerOptions, ts } from 'ts-morph';

import {
  createConfigProviderTaskWithInfo,
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createTaskPhase,
} from '@halfdomelabs/sync';
import { safeMergeAll } from '@halfdomelabs/utils';
import path from 'node:path';
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
import { extractPackageVersions } from '@src/utils/extract-packages.js';

import type { CopyTypescriptFileOptions } from '../../../actions/index.js';
import type { PathMapEntry } from '../../../writers/typescript/imports.js';
import type {
  TypescriptSourceFileOptions,
  TypescriptTemplateConfigOrEntry,
} from '../../../writers/typescript/source-file.js';

import { copyTypescriptFileAction } from '../../../actions/index.js';
import {
  type TypescriptCodeBlock,
  writeJsonToBuilder,
} from '../../../writers/index.js';
import { resolveModule } from '../../../writers/typescript/imports.js';
import { TypescriptSourceFile } from '../../../writers/typescript/source-file.js';
import { createNodePackagesTask } from '../node/node.generator.js';

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

interface WriteTemplatedFilePayload<
  TVariables extends TsCodeTemplateVariableMap,
> {
  template: TsCodeFileTemplate<TVariables>;
  destination: string;
  variables: InferTsCodeTemplateVariablesFromMap<TVariables>;
  fileId: string;
  options?: WriteFileOptions;
}

export interface TypescriptFileProvider {
  writeTemplatedFile<TVariables extends TsCodeTemplateVariableMap>(
    payload: WriteTemplatedFilePayload<TVariables>,
  ): void;
}

export const typescriptFileProvider =
  createProviderType<TypescriptFileProvider>('typescript-file');

const DEFAULT_COMPILER_OPTIONS: TypescriptCompilerOptions = {
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
};

const [setupTask, typescriptSetupProvider, typescriptConfigProvider] =
  createConfigProviderTaskWithInfo(
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
      infoFromDescriptor: (
        descriptor: z.infer<typeof typescriptGeneratorDescriptorSchema>,
      ) => ({
        includeMetadata: descriptor.includeMetadata,
      }),
    },
  );

export { typescriptConfigProvider, typescriptSetupProvider };

export type TypescriptConfigProvider = InferProviderType<
  typeof typescriptConfigProvider
>;

export type TypescriptSetupProvider = InferProviderType<
  typeof typescriptSetupProvider
>;

export const typescriptFileTaskPhase = createTaskPhase('typescript-file');

export function createTypescriptFileTask<
  TVariables extends TsCodeTemplateVariableMap,
>(payload: WriteTemplatedFilePayload<TVariables>): GeneratorTask {
  const task = createGeneratorTask({
    name: payload.fileId,
    phase: typescriptFileTaskPhase,
    dependencies: { typescriptConfig: typescriptConfigProvider },
    run({ typescriptConfig: { compilerOptions, includeMetadata } }) {
      const {
        baseUrl = '.',
        paths = {},
        moduleResolution = 'node',
      } = compilerOptions;
      const { fileId, template, destination, variables, options } = payload;
      const pathMapEntries = generatePathMapEntries(baseUrl, paths);
      const internalPatterns = pathMapEntriesToRegexes(pathMapEntries);

      return {
        async build(builder) {
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
            includeMetadata,
          });

          builder.writeFile({
            id: fileId,
            filePath: destination,
            contents: file,
            options: {
              ...options,
              shouldFormat: true,
            },
          });
        },
      };
    },
  });
  return task;
}

export const typescriptGenerator = createGenerator({
  name: 'node/typescript',
  generatorFileUrl: import.meta.url,
  descriptorSchema: typescriptGeneratorDescriptorSchema,
  preRegisteredPhases: [typescriptFileTaskPhase],
  buildTasks: (descriptor) => ({
    setup: createGeneratorTask(setupTask(descriptor)),
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(CORE_PACKAGES, ['typescript']),
    }),
    main: createGeneratorTask({
      name: 'main',
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
  }),
});
