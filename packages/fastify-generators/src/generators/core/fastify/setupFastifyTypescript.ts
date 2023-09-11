import {
  NodeProvider,
  TypescriptConfigProvider,
} from '@halfdomelabs/core-generators';

export function setupFastifyTypescript(
  node: NodeProvider,
  typescriptConfig: TypescriptConfigProvider,
): void {
  typescriptConfig.setTypescriptVersion('5.1.6');
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
    'tsc-alias': '1.8.7',
    tsx: '3.12.0',
  });
}
