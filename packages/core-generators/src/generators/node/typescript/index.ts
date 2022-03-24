import { join } from 'path';
import {
  createProviderType,
  createGeneratorWithChildren,
  writeJsonAction,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { CompilerOptions, ts } from 'ts-morph';
import {
  copyTypescriptFileAction,
  CopyTypescriptFileOptions,
} from '../../../actions';
import { PathMapEntry } from '../../../writers/typescript/imports';
import {
  TypescriptTemplateConfig,
  TypescriptSourceFile,
  TypescriptSourceFileOptions,
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
    Config extends TypescriptTemplateConfig<Record<string, unknown>>
  >(
    config: Config,
    options?: Omit<TypescriptSourceFileOptions, 'pathMappings'>
  ): TypescriptSourceFile<Config>;
  createCopyAction(
    options: Omit<CopyTypescriptFileOptions, 'pathMappings'>
  ): ReturnType<typeof copyTypescriptFileAction>;
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

const TypescriptGenerator = createGeneratorWithChildren({
  dependencies: {
    node: nodeProvider,
  },
  exports: {
    typescriptConfig: typescriptConfigProvider,
    typescript: typescriptProvider.export().dependsOn(typescriptConfigProvider),
  },
  createGenerator(descriptor, { node }) {
    const config = createNonOverwriteableMap<TypescriptConfig>(DEFAULT_CONFIG, {
      name: 'typescript',
      defaultsOverwriteable: true,
    });

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
        if (!baseUrl || !paths) {
          cachedPathEntries = [];
        } else {
          cachedPathEntries = Object.entries(paths).map(([key, value]) => {
            if (value.length !== 1) {
              throw new Error('We do not support paths with multiple values');
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
      getProviders: () => ({
        typescript: {
          createTemplate: (fileConfig, options) =>
            new TypescriptSourceFile(fileConfig, {
              ...options,
              pathMappings: getPathEntries(),
            }),
          createCopyAction: (options) =>
            copyTypescriptFileAction({
              ...options,
              pathMappings: getPathEntries(),
            }),
        } as TypescriptProvider,
        typescriptConfig: {
          setTypescriptVersion(version) {
            config.merge({ version });
          },
          setTypescriptCompilerOptions(options) {
            config.merge({ compilerOptions: options });
          },
          getCompilerOptions() {
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
          },
          addInclude(path) {
            config.appendUnique('include', [path]);
          },
          addExclude(path) {
            config.appendUnique('exclude', [path]);
          },
        },
      }),
      build: async (builder) => {
        const { compilerOptions, include, exclude, version } = config.value();
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

export default TypescriptGenerator;
