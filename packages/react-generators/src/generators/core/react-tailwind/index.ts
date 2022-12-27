import path from 'path';
import { eslintProvider, nodeProvider } from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  writeTemplateAction,
  copyFileAction,
} from '@baseplate/sync';
import { z } from 'zod';
import { reactProvider } from '../react';

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
  },
  exports: {
    reactTailwind: reactTailwindProvider,
  },
  createGenerator({ globalBodyClasses }, { node, react, eslint }) {
    const srcFolder = react.getSrcFolder();

    node.addDevPackages({
      tailwindcss: '3.2.4',
      'prettier-plugin-tailwindcss': '0.2.1',
      '@tailwindcss/forms': '0.5.3',
    });

    eslint
      .getConfig()
      .appendUnique('eslintIgnore', ['postcs.config.js', 'tailwind.config.js']);

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
          })
        );
        // TODO: Dark mode not supported currently
        await builder.apply(
          copyFileAction({
            source: 'tailwind.config.js',
            destination: 'tailwind.config.js',
            shouldFormat: true,
          })
        );
      },
    };
  },
});

export default ReactTailwindGenerator;
