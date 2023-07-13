import {
  NodeProvider,
  TypescriptConfigProvider,
} from '@halfdomelabs/core-generators';

export function setupFastifyTypescript(
  node: NodeProvider,
  typescriptConfig: TypescriptConfigProvider
): void {
  typescriptConfig.setTypescriptVersion('5.0.4');
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
  typescriptConfig.addExtraSection({
    'ts-node': {
      swc: true,
    },
  });

  node.addDevPackages({
    'tsc-alias': '1.8.6',
    'tsconfig-paths': '4.2.0',
    'node-dev': '8.0.0',
    'ts-node': '10.9.1',
    '@swc/core': '1.3.58',
  });
}
