import {
  NodeProvider,
  TypescriptConfigProvider,
} from '@halfdomelabs/core-generators';

export function setupFastifyTypescript(
  node: NodeProvider,
  typescriptConfig: TypescriptConfigProvider,
): void {
  typescriptConfig.setTypescriptVersion('5.5.4');
  typescriptConfig.setTypescriptCompilerOptions({
    outDir: 'dist',
    declaration: true,
    baseUrl: './',
    paths: {
      '@src/*': ['./src/*'],
    },
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
    skipLibCheck: true,
  });

  const nodeVersion = node.getNodeVersion().split('.')[0];

  node.addDevPackages({
    'tsc-alias': '1.8.10',
    tsx: '4.19.1',
    '@types/node': `^${nodeVersion}.0.0`,
  });
}
