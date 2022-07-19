import { join } from 'path';
import {
  BuilderAction,
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  WriteFileOptions,
  writeJsonAction,
} from '@baseplate/sync';
import { CompilerOptions, ts } from 'ts-morph';
import {
  copyTypescriptFilesAction,
  CopyTypescriptFilesOptions,
} from '@src/actions/copyTypescriptFilesAction';
import {
  copyTypescriptFileAction,
  CopyTypescriptFileOptions,
} from '../../../actions';
import { TypescriptCodeBlock } from '../../../writers';
import {
  PathMapEntry,
  resolveModule,
} from '../../../writers/typescript/imports';
import {
  TypescriptSourceFile,
  TypescriptSourceFileOptions,
  TypescriptTemplateConfigOrEntry,
} from '../../../writers/typescript/sourceFile';
import { nodeProvider } from '../node';

// can use CompilerOptions from Typescript but it requires awkwardly serializing
// CompilerOptions which would have to be done manually
export type TypescriptCompilerOptions = Record<string, unknown>;

export interface TypescriptConfigProvider {
  setTypescriptVersion(version: string): void;
  setTypescriptCompilerOptions(json: TypescriptCompilerOptions): void;
  getCompilerOptions(): CompilerOptions;
  addInclude(path: string): void;
  addExclude(path: string): void;
}

export const typescriptConfigProvider =
  createProviderType<TypescriptConfigProvider>('typescript-config');

export interface TypescriptProvider {
  createTemplate<
    Config extends TypescriptTemplateConfigOrEntry<Record<string, unknown>>
  >(
    config: Config,
    options?: Omit<TypescriptSourceFileOptions, 'pathMappings'>
  ): TypescriptSourceFile<Config>;
  createCopyFilesAction(
    options: Omit<CopyTypescriptFilesOptions, 'pathMappings'>
  ): ReturnType<typeof copyTypescriptFilesAction>;
  createCopyAction(
    options: Omit<CopyTypescriptFileOptions, 'pathMappings'>
  ): ReturnType<typeof copyTypescriptFileAction>;
  renderBlockToAction(
    block: TypescriptCodeBlock,
    destination: string,
    options?: WriteFileOptions
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
}

const TYPESCRIPT_VERSION = '^4.5.4';

const DEFAULT_CONFIG: TypescriptConfig = {
  version: TYPESCRIPT_VERSION,
  compilerOptions: {
    outDir: 'dist',
    declaration: true,
    baseUrl: './src',
    target: 'ES2020',
    lib: ['ES2020'],
    esModuleInterop: true,
    module: 'commonjs',
    moduleResolution: 'node',
    strict: true,
    removeComments: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    sourceMap: true,
  },
  include: ['src'],
  exclude: ['**/node_modules', '**/dist', '**/lib'],
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
          }
        );

        function getCompilerOptions(): CompilerOptions {
          const result = ts.convertCompilerOptionsFromJson(
            config.get('compilerOptions'),
            '.'
          );
          if (result.errors.length) {
            throw new Error(
              `Unable to extract compiler options: ${JSON.stringify(
                result.errors
              )}`
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
            const { baseUrl, paths } = configMap.compilerOptions as {
              baseUrl: string;
              paths: Record<string, string[]>;
            };
            if (!paths && (baseUrl === './' || baseUrl === '.')) {
              // TODO: Support other source folders
              cachedPathEntries = [{ from: 'src', to: 'src' }];
            } else if (!paths || !baseUrl) {
              cachedPathEntries = [];
            } else {
              cachedPathEntries = Object.entries(paths).map(([key, value]) => {
                if (value.length !== 1) {
                  throw new Error(
                    'We do not support paths with multiple values'
                  );
                }
                if (!key.endsWith('/*')) {
                  throw new Error('Paths must end in /*');
                }
                return {
                  from: join(baseUrl, value[0].replace(/\/\*$/, '')).replace(
                    /^\./,
                    ''
                  ),
                  to: key.substring(0, key.length - 2),
                };
              });
            }
          }

          return cachedPathEntries;
        }
        return {
          getProviders() {
            return {
              typescript: {
                createTemplate: (fileConfig, options) =>
                  new TypescriptSourceFile(fileConfig, {
                    ...options,
                    pathMappings: getPathEntries(),
                  }),
                createCopyFilesAction: (options) =>
                  copyTypescriptFilesAction({
                    ...options,
                    pathMappings: getPathEntries(),
                  }),
                createCopyAction: (options) =>
                  copyTypescriptFileAction({
                    ...options,
                    pathMappings: getPathEntries(),
                  }),
                renderBlockToAction: (block, destination, options) => {
                  const file = new TypescriptSourceFile(
                    { BLOCK: { type: 'code-block' } },
                    { pathMappings: getPathEntries() }
                  );
                  file.addCodeEntries({ BLOCK: block });
                  return file.renderToActionFromText(
                    'BLOCK',
                    destination,
                    options
                  );
                },
                resolveModule: (moduleSpecifier, from) =>
                  resolveModule(moduleSpecifier, from, {
                    pathMapEntries: getPathEntries(),
                  }),
                getCompilerOptions,
              } as TypescriptProvider,
            };
          },
          async build(builder) {
            const { compilerOptions, include, exclude, version } =
              config.value();
            node.addDevPackage('typescript', version);

            await builder.apply(
              writeJsonAction({
                destination: 'tsconfig.json',
                contents: { compilerOptions, include, exclude },
              })
            );
          },
        };
      },
    });
  },
});

export default TypescriptGenerator;
