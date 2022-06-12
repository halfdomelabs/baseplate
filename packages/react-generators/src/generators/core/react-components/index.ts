import {
  copyTypescriptFileAction,
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
  writeFormattedAction,
} from '@baseplate/sync';
import { z } from 'zod';
import { reactProvider } from '../react';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface ReactComponentEntry {
  name: string;
}

const REACT_COMPONENTS: ReactComponentEntry[] = [
  { name: 'Alert' },
  { name: 'AlertIcon' },
  { name: 'BackButton' },
  { name: 'Button' },
  { name: 'Card' },
  { name: 'CheckedInput' },
  { name: 'ErrorableLoader' },
  { name: 'FormError' },
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
];

export interface ReactComponentsProvider extends ImportMapper {
  /**
   * Registers component entry so it gets exported by root index component
   *
   * @param entry Component entry to register
   */
  registerComponent(entry: ReactComponentEntry): void;
  getComponentsFolder(): string;
  getComponentsImport(): string;
}

export const reactComponentsProvider =
  createProviderType<ReactComponentsProvider>('react-components');

const ReactComponentsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {
    react: reactProvider,
    node: nodeProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactComponents: reactComponentsProvider,
  },
  createGenerator(descriptor, { react, node, typescript }) {
    const srcFolder = react.getSrcFolder();
    node.addPackages({
      '@headlessui/react': '^1.5.0',
      '@hookform/resolvers': '^2.8.8',
      classnames: '^2.3.1',
      'react-hook-form': '^7.28.0',
      'react-hot-toast': '^2.2.0',
      'react-icons': '^4.3.1',
    });
    const [useStatusImport, useStatusPath] = makeImportAndFilePath(
      `${srcFolder}/hooks/useStatus.ts`
    );
    const [useToastImport, useToastPath] = makeImportAndFilePath(
      `${srcFolder}/hooks/useToast.tsx`
    );
    const allReactComponents = [...REACT_COMPONENTS];
    return {
      getProviders: () => ({
        reactComponents: {
          registerComponent: (entry) => allReactComponents.push(entry),
          getComponentsFolder: () => `${srcFolder}/components`,
          getComponentsImport: () => `@/${srcFolder}/components`,
          getImportMap: () => ({
            '%react-components': {
              path: `@/${srcFolder}/components`,
              allowedImports: REACT_COMPONENTS.map((entry) => entry.name),
            },
            '%react-components/useStatus': {
              path: useStatusImport,
              allowedImports: ['StatusType', 'Status', 'useStatus'],
            },
            '%react-components/useToast': {
              path: useToastImport,
              allowedImports: ['useToast'],
            },
          }),
        },
      }),
      build: async (builder) => {
        await Promise.all(
          REACT_COMPONENTS.map(async ({ name }) =>
            builder.apply(
              copyTypescriptFileAction({
                source: `components/${name}/index.tsx`,
                destination: `${srcFolder}/components/${name}/index.tsx`,
              })
            )
          )
        );
        await builder.apply(
          copyTypescriptFileAction({
            source: 'hooks/useStatus.ts',
            destination: useStatusPath,
          })
        );

        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useToast.tsx',
            destination: useToastPath,
            replacements: {
              COMPONENT_FOLDER: `@/${srcFolder}/components`,
            },
          })
        );

        // build component index
        const componentNames = allReactComponents.map((entry) => entry.name);
        const componentIndex = componentNames
          .map((name) => `export { default as ${name} } from './${name}';`)
          .join('\n');
        await builder.apply(
          writeFormattedAction({
            contents: componentIndex,
            destination: `${srcFolder}/components/index.ts`,
          })
        );
      },
    };
  },
});

export default ReactComponentsGenerator;
