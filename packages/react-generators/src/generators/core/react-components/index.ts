import {
  copyTypescriptFileAction,
  nodeProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactProvider } from '../react';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

interface ReactComponentEntry {
  name: string;
}

const REACT_COMPONENTS: ReactComponentEntry[] = [
  { name: 'Alert' },
  { name: 'AlertIcon' },
  { name: 'BackButton' },
  { name: 'Button' },
  { name: 'Card' },
  { name: 'ErrorableLoader' },
  { name: 'FormLabel' },
  { name: 'LinkButton' },
  { name: 'ListGroup' },
  { name: 'NotFoundCard' },
  { name: 'SelectInput' },
  { name: 'Sidebar' },
  { name: 'Spinner' },
  { name: 'Table' },
  { name: 'TextInput' },
  { name: 'Toast' },
  { name: 'UnauthenticatedLayout' },
];

export interface ReactComponentsProvider {
  getComponentsFolder(): string;
}

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
        reactComponents: {
          getComponentsFolder: () => `${srcFolder}/components`,
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(srcFolder);
        await Promise.all(
          REACT_COMPONENTS.map(async ({ name }) =>
            builder.apply(
              copyTypescriptFileAction({
                source: `components/${name}/index.tsx`,
                destination: `components/${name}/index.tsx`,
              })
            )
          )
        );
        await builder.apply(
          copyTypescriptFileAction({
            source: 'hooks/useStatus.ts',
            destination: 'hooks/useStatus.ts',
          })
        );
      },
    };
  },
});

export default ReactComponentsGenerator;
