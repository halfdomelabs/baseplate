import {
  NodeProvider,
  TypescriptConfigProvider,
} from '@baseplate/core-generators';

export function setupFastifyTypescript(
  node: NodeProvider,
  typescriptConfig: TypescriptConfigProvider
): void {
  typescriptConfig.setTypescriptVersion('^4.5.4');
  typescriptConfig.setTypescriptCompilerOptions({
    outDir: 'dist',
    declaration: true,
    baseUrl: './',
    paths: {
      '@src/*': ['./src/*'],
    },
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
  });

  node.addDevPackages({
    'tsc-alias': '^1.5.0',
    'tsconfig-paths': '^3.12.0',
    'ts-node-dev': '^1.1.8',
    'ts-node': '^9.1.1',
  });
}
