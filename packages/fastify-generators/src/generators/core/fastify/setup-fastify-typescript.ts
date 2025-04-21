import { typescriptSetupProvider } from '@halfdomelabs/core-generators';
import { createGeneratorTask } from '@halfdomelabs/sync';

export const fastifyTypescriptTask = createGeneratorTask({
  dependencies: {
    typescriptSetup: typescriptSetupProvider,
  },
  run({ typescriptSetup }) {
    typescriptSetup.compilerOptions.set({
      outDir: 'dist',
      declaration: true,
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
  },
});
