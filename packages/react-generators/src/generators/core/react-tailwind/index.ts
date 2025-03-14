import {
  eslintProvider,
  nodeProvider,
  prettierProvider,
  projectScope,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGenerator,
  createProviderType,
  writeTemplateAction,
} from '@halfdomelabs/sync';
import path from 'node:path';
import * as prettierPluginTailwindcss from 'prettier-plugin-tailwindcss';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

import { reactProvider } from '../react/index.js';

const descriptorSchema = z.object({
  globalBodyClasses: z.string().optional(),
});

export interface ReactTailwindProvider {
  addGlobalStyle: (style: string) => void;
}

export const reactTailwindProvider =
  createProviderType<ReactTailwindProvider>('react-tailwind');

export const reactTailwindGenerator = createGenerator({
  name: 'core/react-tailwind',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { globalBodyClasses }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        react: reactProvider,
        node: nodeProvider,
        eslint: eslintProvider,
        prettier: prettierProvider,
      },
      exports: {
        reactTailwind: reactTailwindProvider.export(projectScope),
      },
      run({ node, react, eslint, prettier }) {
        const srcFolder = react.getSrcFolder();

        node.addDevPackages({
          autoprefixer: REACT_PACKAGES.autoprefixer,
          tailwindcss: REACT_PACKAGES.tailwindcss,
          'prettier-plugin-tailwindcss':
            REACT_PACKAGES['prettier-plugin-tailwindcss'],
          '@tailwindcss/forms': REACT_PACKAGES['@tailwindcss/forms'],
        });

        eslint
          .getConfig()
          .appendUnique('eslintIgnore', [
            'vite.config.ts',
            'postcss.config.js',
            'tailwind.config.js',
          ]);

        prettier.addPlugin({
          name: 'prettier-plugin-tailwindcss',
          version: REACT_PACKAGES['prettier-plugin-tailwindcss'],
          default: prettierPluginTailwindcss,
        });

        react.getIndexFile().addCodeBlock('IMPORTS', "import './index.css'");

        const globalStyles: string[] = [];

        if (globalBodyClasses) {
          globalStyles.push(`body {
  @apply ${globalBodyClasses}
}`);
        }

        return {
          providers: {
            reactTailwind: {
              addGlobalStyle: (style) => {
                globalStyles.push(style);
              },
            },
          },
          build: async (builder) => {
            await builder.apply(
              writeTemplateAction({
                template: 'src/index.css',
                destination: path.join(srcFolder, 'index.css'),
                data: {
                  globalStyles: globalStyles.join('\n\n'),
                },
              }),
            );
            // TODO: Dark mode not supported currently
            await builder.apply(
              copyFileAction({
                source: 'tpl.tailwind.config.js',
                destination: 'tailwind.config.js',
                shouldFormat: true,
              }),
            );
            await builder.apply(
              copyFileAction({
                source: 'postcss.config.js',
                destination: 'postcss.config.js',
                shouldFormat: true,
              }),
            );
          },
        };
      },
    });
  },
});
