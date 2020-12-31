import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  createProviderType,
  GeneratorDescriptor,
  writeJsonAction,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { nodeProvider } from '../node';

type Descriptor = GeneratorDescriptor;

const descriptorSchema = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypescriptCompilerOptions = any;

export interface TypescriptProvider {
  setTypescriptVersion(version: string): void;
  setTypescriptCompilerOptions(options: TypescriptCompilerOptions): void;
  addInclude(path: string): void;
  addExclude(path: string): void;
}

export const typescriptProvider = createProviderType<TypescriptProvider>(
  'typescript'
);

const DEFAULT_CONFIG = {
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
  },
  exports: {
    typescript: typescriptProvider,
  },
  createGenerator(descriptor, { node }) {
    const config = createNonOverwriteableMap(DEFAULT_CONFIG, 'typescript');
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
            addInclude(path) {
              config.mergeUnique({ include: [path] });
            },
            addExclude(path) {
              config.mergeUnique({ exclude: [path] });
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
