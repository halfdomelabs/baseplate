import {
  eslintProvider,
  typescriptSetupProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  writeJsonAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export const reactTypescriptGenerator = createGenerator({
  name: 'core/react-typescript',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        typescriptSetup: typescriptSetupProvider,
        eslint: eslintProvider,
      },
      run({ typescriptSetup, eslint }) {
        typescriptSetup.version.set('5.5.4', 'react');
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
            baseUrl: './',
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
        eslint
          .getConfig()
          .appendUnique('extraTsconfigProjects', './tsconfig.node.json');
        return {
          build: async (builder) => {
            await builder.apply(
              writeJsonAction({
                destination: 'tsconfig.node.json',
                contents: {
                  compilerOptions: {
                    composite: true,
                    moduleResolution: 'Node',
                  },
                  include: ['vite.config.ts'],
                },
              }),
            );
          },
        };
      },
    }),
  ],
});
