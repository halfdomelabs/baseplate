import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { tsCodeFragment } from '#src/renderers/typescript/index.js';
import { writeJsonToBuilder } from '#src/writers/json.js';

import { eslintConfigProvider } from '../eslint/index.js';
import { nodeProvider } from '../node/index.js';
import {
  typescriptFileProvider,
  typescriptSetupProvider,
} from '../typescript/index.js';

const descriptorSchema = z.object({
  includePlaceholderIndexFile: z.boolean().default(true),
});

/**
 * Generator for configuring a node library package with tsc build.
 *
 * This generator:
 * 1. Configures TypeScript for composite builds with declaration files
 * 2. Adds tsconfig.build.json for library compilation
 * 3. Sets up package.json with build scripts and exports
 * 4. Generates a src/index.ts entry point
 */
export const nodeLibraryGenerator = createGenerator({
  name: 'node/node-library',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ includePlaceholderIndexFile }) => ({
    configureTypescript: createGeneratorTask({
      dependencies: {
        typescriptSetup: typescriptSetupProvider,
      },
      run({ typescriptSetup }) {
        // Configure TypeScript for library builds
        typescriptSetup.isComposite.set(true);
      },
    }),
    tsconfigBuild: createGeneratorTask({
      run() {
        return {
          build(builder) {
            // Create tsconfig.build.json that extends base tsconfig
            writeJsonToBuilder(builder, {
              id: 'tsconfig-build',
              destination: 'tsconfig.build.json',
              contents: {
                extends: './tsconfig.json',
                compilerOptions: {
                  rootDir: 'src',
                  outDir: 'dist',
                },
                include: ['src'],
                exclude: ['src/**/*.test.ts', '**/__mocks__/**/*'],
              },
            });
          },
        };
      },
    }),
    scripts: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
      },
      run({ node }) {
        // Add build script using tsc
        node.scripts.set('build', 'tsc -p tsconfig.build.json');
        node.scripts.set('watch', 'tsc -p tsconfig.build.json --watch');
        node.scripts.set('clean', 'rm -rf dist');

        // Configure package exports
        node.extraProperties.merge({
          main: './dist/index.js',
          types: './dist/index.d.ts',
          exports: {
            '.': {
              types: './dist/index.d.ts',
              import: './dist/index.js',
            },
          },
        });

        node.files.push('dist');
      },
    }),
    eslintConfig: createGeneratorTask({
      dependencies: {
        eslintConfig: eslintConfigProvider,
      },
      run({ eslintConfig }) {
        eslintConfig.tsDefaultProjectFiles.push('vitest.config.ts');
      },
    }),
    indexFile: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
      },
      run({ typescriptFile }) {
        return {
          async build(builder) {
            // Generate basic src/index.ts entry point
            if (includePlaceholderIndexFile) {
              await builder.apply(
                typescriptFile.renderTemplateFragment({
                  id: 'index-file',
                  destination: 'src/index.ts',
                  fragment: tsCodeFragment(
                    `// Export your library modules here\nexport const placeholder = 'placeholder';\n`,
                  ),
                }),
              );
            }
          },
        };
      },
    }),
  }),
});
