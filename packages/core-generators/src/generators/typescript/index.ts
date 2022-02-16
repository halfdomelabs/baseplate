import {
  createProviderType,
  createGeneratorWithChildren,
  writeJsonAction,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { CompilerOptions, ts } from 'ts-morph';
import { nodeProvider } from '../node';

// can use CompilerOptions from Typescript but it requires awkwardly serializing
// CompilerOptions which would have to be done manually
export type TypescriptCompilerOptions = Record<string, unknown>;

export interface TypescriptProvider {
  setTypescriptVersion(version: string): void;
  setTypescriptCompilerOptions(json: TypescriptCompilerOptions): void;
  getCompilerOptions(): CompilerOptions;
  addInclude(path: string): void;
  addExclude(path: string): void;
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
    typescript: typescriptProvider,
  },
  createGenerator(descriptor, { node }) {
    const config = createNonOverwriteableMap<TypescriptConfig>(DEFAULT_CONFIG, {
      name: 'typescript',
      defaultsOverrideable: true,
    });
    return {
      getProviders: () => ({
        typescript: {
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
