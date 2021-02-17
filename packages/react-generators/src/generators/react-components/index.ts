import { nodeProvider } from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  copyFileAction,
  copyDirectoryAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactProvider } from '../react';
import { reactRouterProvider } from '../react-router';

interface ReactComponentsDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

export type ReactComponentsProvider = {};

export const reactComponentsProvider = createProviderType<ReactComponentsProvider>(
  'react-components'
);

const ReactComponentsGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ReactComponentsDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    react: reactProvider,
    node: nodeProvider,
    reactRouter: reactRouterProvider,
  },
  exports: {
    reactComponents: reactComponentsProvider,
  },
  createGenerator(descriptor, { react, node, reactRouter }) {
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
      getProviders: () => {
        return {
          reactComponents: {},
        };
      },
      build: (context) => {
        context.addAction(
          copyFileAction({
            source: 'index.scss',
            destination: 'src/index.scss',
          })
        );
        context.addAction(
          copyDirectoryAction({
            source: 'components',
            destination: 'src/components',
          })
        );
        context.addAction(
          copyDirectoryAction({
            source: 'hooks',
            destination: 'src/hooks',
          })
        );
        react.getIndexFile().addCodeBlock('HEADER', {
          code: "import './index.scss'",
        });
        reactRouter.setNotFoundPageComponent({
          code: 'NotFoundPage',
          importText: ["import NotFoundPage from 'components/NotFoundPage'"],
        });
      },
    };
  },
});

export default ReactComponentsGenerator;
