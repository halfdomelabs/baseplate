import {
  BuilderAction,
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  WriteFileOptions,
  writeJsonAction,
} from '@halfdomelabs/sync';
import { join } from 'path';
import * as R from 'ramda';
import { CompilerOptions, ts } from 'ts-morph';

import {
  copyTypescriptFileAction,
  CopyTypescriptFileOptions,
} from '../../../actions/index.js';
import { TypescriptCodeBlock } from '../../../writers/index.js';
import {
  ModuleResolutionMethod,
  PathMapEntry,
  resolveModule,
} from '../../../writers/typescript/imports.js';
import {
  TypescriptSourceFile,
  TypescriptSourceFileOptions,
  TypescriptTemplateConfigOrEntry,
} from '../../../writers/typescript/sourceFile.js';
import { nodeProvider } from '../node/index.js';
import {
  copyTypescriptFilesAction,
  CopyTypescriptFilesOptions,
} from '@src/actions/copyTypescriptFilesAction.js';

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
  createTemplate<
    Config extends TypescriptTemplateConfigOrEntry<Record<string, unknown>>,
  >(
    config: Config,
    options?: Omit<
      TypescriptSourceFileOptions,
      'pathMappings' | 'resolutionMethod'
    >,
  ): TypescriptSourceFile<Config>;
  createCopyFilesAction(
    options: Omit<
      CopyTypescriptFilesOptions,
      'pathMappings' | 'resolutionMethod'
    >,
  ): ReturnType<typeof copyTypescriptFilesAction>;
  createCopyAction(
    options: Omit<
      CopyTypescriptFileOptions,
      'pathMappings' | 'resolutionMethod'
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

interface TypescriptConfig {
  version: string;
  compilerOptions: TypescriptCompilerOptions;
  include: string[];
  exclude: string[];
  references: TypescriptConfigReference[];
  extraSections: Record<string, unknown>[];
}

const TYPESCRIPT_VERSION = '^4.5.4';

const DEFAULT_CONFIG: TypescriptConfig = {
  version: TYPESCRIPT_VERSION,
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

const TypescriptGenerator = createGeneratorWithTasks({
  buildTasks(taskBuilder) {
    const configTask = taskBuilder.addTask({
      name: 'config',
      exports: {
        typescriptConfig: typescriptConfigProvider,
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
          if (result.errors.length) {
            throw new Error(
              `Unable to extract compiler options: ${JSON.stringify(
                result.errors,
              )}`,
            );
          }
          return result.options;
        }

        return {
          getProviders: () => ({
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
          }),
          build: () => ({ config, getCompilerOptions }),
        };
      },
    });

    taskBuilder.addTask({
      name: 'main',
      dependencies: { node: nodeProvider },
      exports: { typescript: typescriptProvider },
      taskDependencies: { configTask },
      run({ node }, { configTask: { config, getCompilerOptions } }) {
        let cachedPathEntries: PathMapEntry[];

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
                  from: join(baseUrl, value[0].replace(/\/\*$/, '')).replace(
                    /^\./,
                    '',
                  ),
                  to: key.substring(0, key.length - 2),
                };
              });
            }
          }

          return cachedPathEntries;
        }

        const moduleResolution =
          config.value().compilerOptions.moduleResolution;
        const moduleResolutionMethod: ModuleResolutionMethod =
          moduleResolution === 'node16' || moduleResolution === 'nodenext'
            ? 'esm'
            : 'cjs';

        return {
          getProviders() {
            return {
              typescript: {
                createTemplate: (fileConfig, options) =>
                  new TypescriptSourceFile(fileConfig, {
                    ...options,
                    pathMappings: getPathEntries(),
                    resolutionMethod: moduleResolutionMethod,
                  }),
                createCopyFilesAction: (options) =>
                  copyTypescriptFilesAction({
                    ...options,
                    pathMappings: getPathEntries(),
                    resolutionMethod: moduleResolutionMethod,
                  }),
                createCopyAction: (options) =>
                  copyTypescriptFileAction({
                    ...options,
                    pathMappings: getPathEntries(),
                    resolutionMethod: moduleResolutionMethod,
                  }),
                renderBlockToAction: (block, destination, options) => {
                  const file = new TypescriptSourceFile(
                    { BLOCK: { type: 'code-block' } },
                    {
                      pathMappings: getPathEntries(),
                      resolutionMethod: moduleResolutionMethod,
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
                    resolutionMethod: moduleResolutionMethod,
                  }),
                getCompilerOptions,
              } as TypescriptProvider,
            };
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
                  references: references.length ? references : undefined,
                  ...R.mergeAll(extraSections),
                },
              }),
            );
          },
        };
      },
    });
  },
});

export default TypescriptGenerator;
