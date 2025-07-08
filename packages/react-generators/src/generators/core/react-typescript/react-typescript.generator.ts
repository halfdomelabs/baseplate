import {
  packageScope,
  typescriptSetupProvider,
  writeJsonToBuilder,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export interface ReactTypescriptProvider {
  addNodeTsFile(filePath: string): void;
}

export const reactTypescriptProvider =
  createProviderType<ReactTypescriptProvider>('react-typescript');

export const reactTypescriptGenerator = createGenerator({
  name: 'core/react-typescript',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        typescriptSetup: typescriptSetupProvider,
      },
      exports: {
        reactTypescript: reactTypescriptProvider.export(packageScope),
      },
      run({ typescriptSetup }) {
        const nodeTsFiles: string[] = ['vite.config.ts'];
        typescriptSetup.compilerOptions.set(
          {
            /* Compilation */
            target: 'es2022',
            useDefineForClassFields: true,
            lib: ['dom', 'dom.iterable', 'es2022'],
            module: 'esnext',
            skipLibCheck: true,

            /* Bundler mode */
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            verbatimModuleSyntax: true,
            noEmit: true,
            jsx: 'react-jsx',

            /* Linting */
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
            noUncheckedSideEffectImports: true,

            /* Paths */
            paths: {
              '@src/*': ['./src/*'],
            },
          },
          'react',
        );
        typescriptSetup.include.push('src');
        typescriptSetup.tsconfigPath.set('tsconfig.app.json');
        return {
          providers: {
            reactTypescript: {
              addNodeTsFile: (filePath: string) => {
                nodeTsFiles.push(filePath);
              },
            },
          },
          build: (builder) => {
            writeJsonToBuilder(builder, {
              id: 'tsconfig-root',
              destination: 'tsconfig.json',
              contents: {
                files: [],
                references: [
                  { path: './tsconfig.app.json' },
                  { path: './tsconfig.node.json' },
                ],
              },
            });
            writeJsonToBuilder(builder, {
              id: 'tsconfig-node',
              destination: 'tsconfig.node.json',
              contents: {
                compilerOptions: {
                  target: 'ES2023',
                  lib: ['ES2023'],
                  module: 'ESNext',
                  skipLibCheck: true,
                  composite: true,

                  /* Bundler mode */
                  moduleResolution: 'bundler',
                  allowImportingTsExtensions: true,
                  verbatimModuleSyntax: true,
                  moduleDetection: 'force',
                  noEmit: true,

                  /* Linting */
                  strict: true,
                  noUnusedLocals: true,
                  noUnusedParameters: true,
                  noFallthroughCasesInSwitch: true,
                  noUncheckedSideEffectImports: true,
                },
                include: nodeTsFiles.toSorted(),
              },
            });
          },
        };
      },
    }),
  }),
});
