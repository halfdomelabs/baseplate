import {
  eslintProvider,
  nodeProvider,
  prettierProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  writeTemplateAction,
  copyFileAction,
} from '@halfdomelabs/sync';
import path from 'path';
import * as prettierPluginTailwindcss from 'prettier-plugin-tailwindcss';
import { z } from 'zod';

import { reactProvider } from '../react/index.js';

const descriptorSchema = z.object({
  globalBodyClasses: z.string().optional(),
});

export interface ReactTailwindProvider {
  addGlobalStyle: (style: string) => void;
}

export const reactTailwindProvider =
  createProviderType<ReactTailwindProvider>('react-tailwind');

const ReactTailwindGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    react: reactProvider,
    node: nodeProvider,
    eslint: eslintProvider,
    prettier: prettierProvider,
  },
  exports: {
    reactTailwind: reactTailwindProvider,
  },
  createGenerator({ globalBodyClasses }, { node, react, eslint, prettier }) {
    const srcFolder = react.getSrcFolder();

    const prettierPluginTailwindcssVersion = '0.6.5';

    node.addDevPackages({
      autoprefixer: '10.4.19',
      tailwindcss: '3.4.3',
      'prettier-plugin-tailwindcss': prettierPluginTailwindcssVersion,
      '@tailwindcss/forms': '0.5.7',
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
      version: prettierPluginTailwindcssVersion,
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
      getProviders: () => ({
        reactTailwind: {
          addGlobalStyle: (style) => {
            globalStyles.push(style);
          },
        },
      }),
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
            source: 'tailwind.config.js',
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

export default ReactTailwindGenerator;
