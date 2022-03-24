import { nodeProvider } from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
  copyDirectoryAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactProvider } from '../react';

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
  },
  exports: {
    reactComponents: reactComponentsProvider,
  },
  createGenerator(descriptor, { react, node }) {
    const srcFolder = react.getSrcFolder();
    node.addPackages({
      '@headlessui/react': '^1.5.0',
      '@hookform/resolvers': '^2.8.8',
      classnames: '^2.3.1',
      'react-hook-form': '^7.28.0',
      'react-hot-toast': '^2.2.0',
      'react-icons': '^4.3.1',
    });
    return {
      getProviders: () => ({
        reactComponents: {},
      }),
      build: async (builder) => {
        builder.setBaseDirectory(srcFolder);
        await builder.apply(
          copyDirectoryAction({
            source: 'components',
            destination: 'components',
          })
        );
        await builder.apply(
          copyDirectoryAction({
            source: 'hooks',
            destination: 'hooks',
          })
        );
      },
    };
  },
});

export default ReactComponentsGenerator;
