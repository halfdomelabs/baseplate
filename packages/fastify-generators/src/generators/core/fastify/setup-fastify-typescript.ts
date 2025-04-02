import type {
  NodeProvider,
  TypescriptSetupProvider,
} from '@halfdomelabs/core-generators';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

export function setupFastifyTypescript(
  node: NodeProvider,
  typescriptConfig: TypescriptSetupProvider,
  taskId: string,
): void {
  typescriptConfig.version.set('5.5.4', taskId);
  typescriptConfig.compilerOptions.set(
    {
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
    },
    taskId,
  );

  node.addDevPackages({
    'tsc-alias': FASTIFY_PACKAGES['tsc-alias'],
    tsx: FASTIFY_PACKAGES.tsx,
    '@types/node': FASTIFY_PACKAGES['@types/node'],
  });
}
