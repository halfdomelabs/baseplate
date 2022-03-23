import { nodeProvider, TypescriptCodeUtils } from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
  copyFileAction,
  copyDirectoryAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactProvider } from '../react';
import { reactRouterProvider } from '../react-router';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export type ReactComponentsProvider = unknown;

export const reactComponentsProvider =
  createProviderType<ReactComponentsProvider>('react-components');

const ReactComponentsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {
    react: reactProvider,
    node: nodeProvider,
    reactRouter: reactRouterProvider,
  },
  exports: {
    reactComponents: reactComponentsProvider,
  },
  createGenerator(descriptor, { react, node, reactRouter }) {
    const srcFolder = react.getSrcFolder();
    node.addPackages({
      bulma: '^0.9.1',
      'styled-components': '^5.2.1',
      classnames: '^2.2.6',
      formik: '^2.2.6',
    });
    node.addDevPackages({
      '@types/styled-components': '^5.1.7',
      'node-sass': '^4.14.1',
      '@types/classnames': '^2.2.11',
    });
    return {
      getProviders: () => ({
        reactComponents: {},
      }),
      build: async (builder) => {
        await builder.apply(
          copyFileAction({
            source: 'index.scss',
            destination: 'src/index.scss',
          })
        );
        await builder.apply(
          copyDirectoryAction({
            source: 'components',
            destination: 'src/components',
          })
        );
        await builder.apply(
          copyDirectoryAction({
            source: 'hooks',
            destination: 'src/hooks',
          })
        );
        react
          .getIndexFile()
          .addCodeBlock(
            'HEADER',
            TypescriptCodeUtils.createBlock("import './index.scss'")
          );
        // reactRouter.setNotFoundPageComponent(
        //   TypescriptCodeUtils.createExpression(
        //     'NotFoundPage',
        //     `import NotFoundPage from '@/${srcFolder}/components/NotFoundPage'`
        //   )
        // );
      },
    };
  },
});

export default ReactComponentsGenerator;
