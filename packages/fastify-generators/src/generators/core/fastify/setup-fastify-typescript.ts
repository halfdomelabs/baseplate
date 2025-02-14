import type {
  NodeProvider,
  TypescriptConfigProvider,
} from '@halfdomelabs/core-generators';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

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

  node.addDevPackages({
    'tsc-alias': FASTIFY_PACKAGES['tsc-alias'],
    tsx: FASTIFY_PACKAGES.tsx,
    '@types/node': FASTIFY_PACKAGES['@types/node'],
  });
}
