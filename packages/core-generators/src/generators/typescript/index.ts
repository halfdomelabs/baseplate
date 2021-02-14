import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  createProviderType,
  GeneratorDescriptor,
  writeJsonAction,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { CodeBlockWriter, CompilerOptions, ts } from 'ts-morph';
import { nodeProvider } from '../node';
import { prettierProvider } from '../prettier';

type Descriptor = GeneratorDescriptor;

const descriptorSchema = {};

// can use CompilerOptions from Typescript but it requires awkwardly serializing
// CompilerOptions which would have to be done manually
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypescriptCompilerOptions = any;

export interface TypescriptProvider {
  setTypescriptVersion(version: string): void;
  setTypescriptCompilerOptions(json: TypescriptCompilerOptions): void;
  getCompilerOptions(): CompilerOptions;
  buildWriter(): CodeBlockWriter;
  addInclude(path: string): void;
  addExclude(path: string): void;
}

export const typescriptProvider = createProviderType<TypescriptProvider>(
  'typescript'
);

interface TypescriptConfig {
  version: string;
  compilerOptions: TypescriptCompilerOptions;
  include: string[];
  exclude: string[];
}

const DEFAULT_CONFIG: TypescriptConfig = {
  version: '^4.1.3',
  compilerOptions: {
    outDir: 'dist',
    declaration: true,
    target: 'es2018',
    lib: ['ES2018'],
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
  exclude: ['**/node_modules', '**/dist', '**/lib', '**/*.test.ts'],
};

const TypescriptGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<Descriptor>(descriptorSchema),
  dependsOn: {
    node: nodeProvider,
    prettier: prettierProvider,
  },
  exports: {
    typescript: typescriptProvider,
  },
  createGenerator(descriptor, { node, prettier }) {
    const config = createNonOverwriteableMap<TypescriptConfig>(
      DEFAULT_CONFIG,
      'typescript'
    );
    return {
      getProviders: () => {
        return {
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
              config.mergeUnique({ include: [path] });
            },
            addExclude(path) {
              config.mergeUnique({ exclude: [path] });
            },
            buildWriter(): CodeBlockWriter {
              const prettierConfig = prettier.getConfig();
              return new CodeBlockWriter({
                indentNumberOfSpaces: prettierConfig.tabWidth,
                useSingleQuote: prettierConfig.singleQuote,
              });
            },
          },
        };
      },
      build: (context) => {
        const { compilerOptions, include, exclude, version } = config.value();
        node.addDevPackage('typescript', version);

        context.addAction(
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
