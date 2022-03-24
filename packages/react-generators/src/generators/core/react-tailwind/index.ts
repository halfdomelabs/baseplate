import path from 'path';
import { eslintProvider, nodeProvider } from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  writeTemplateAction,
  copyFileAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactProvider } from '../react';

const descriptorSchema = yup.object({
  globalBodyClasses: yup.string(),
});

export type ReactTailwindProvider = unknown;

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
      tailwindcss: '^3.0.23',
    });

    eslint
      .getConfig()
      .appendUnique('eslintIgnore', ['postcs.config.js', 'tailwind.config.js']);

    react.getIndexFile().addCodeBlock('IMPORTS', "import './index.css'");

    const globalStyles: string[] = [];

    if (globalBodyClasses) {
      globalStyles.push(`
body {
  @apply ${globalBodyClasses}
}`);
    }

    return {
      getProviders: () => ({
        reactTailwind: {},
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
        await builder.apply(
          copyFileAction({
            source: 'tailwind.config.js',
            destination: 'tailwind.config.js',
          })
        );
      },
    };
  },
});

export default ReactTailwindGenerator;
