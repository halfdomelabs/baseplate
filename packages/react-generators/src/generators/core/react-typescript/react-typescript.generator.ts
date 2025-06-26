import {
  typescriptSetupProvider,
  writeJsonToBuilder,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export const reactTypescriptGenerator = createGenerator({
  name: 'core/react-typescript',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        typescriptSetup: typescriptSetupProvider,
      },
      run({ typescriptSetup }) {
        typescriptSetup.compilerOptions.set(
          {
            /* Compilation */
            lib: ['dom', 'dom.iterable', 'esnext'],
            module: 'esnext',
            target: 'esnext',
            skipLibCheck: true,
            esModuleInterop: false,
            allowJs: false,
            jsx: 'react-jsx',

            /* Linting */
            strict: true,

            /* Resolution */
            allowSyntheticDefaultImports: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            moduleResolution: 'bundler',

            /* Output */
            isolatedModules: true,
            noEmit: true,

            /* Paths */
            paths: {
              '@src/*': ['./src/*'],
            },
          },
          'react',
        );
        typescriptSetup.include.push('src');
        typescriptSetup.references.push({
          path: './tsconfig.node.json',
        });
        return {
          build: (builder) => {
            writeJsonToBuilder(builder, {
              id: 'tsconfig-node',
              destination: 'tsconfig.node.json',
              contents: {
                compilerOptions: {
                  composite: true,
                  moduleResolution: 'Bundler',
                  strict: true,
                },
                include: ['vite.config.ts'],
              },
            });
          },
        };
      },
    }),
  }),
});
