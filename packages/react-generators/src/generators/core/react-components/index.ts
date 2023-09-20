import {
  copyTypescriptFileAction,
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
  writeFormattedAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { reactProvider } from '../react/index.js';
import { reactAppProvider } from '../react-app/index.js';

const descriptorSchema = z.object({
  includeDatePicker: z.boolean().optional(),
});

export interface ReactComponentEntry {
  name: string;
}

const REACT_COMPONENTS: ReactComponentEntry[] = [
  { name: 'Alert' },
  { name: 'AlertIcon' },
  { name: 'BackButton' },
  { name: 'Button' },
  { name: 'ButtonGroup' },
  { name: 'Card' },
  { name: 'CheckedInput' },
  { name: 'ErrorDisplay' },
  { name: 'ErrorableLoader' },
  { name: 'FormError' },
  { name: 'FormLabel' },
  { name: 'LinkButton' },
  { name: 'ListGroup' },
  { name: 'Modal' },
  { name: 'NotFoundCard' },
  { name: 'ReactSelectInput' },
  { name: 'SelectInput' },
  { name: 'Sidebar' },
  { name: 'Spinner' },
  { name: 'Table' },
  { name: 'TextAreaInput' },
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
    reactApp: reactAppProvider,
  },
  exports: {
    reactComponents: reactComponentsProvider,
  },
  createGenerator(
    { includeDatePicker },
    { react, node, typescript, reactApp },
  ) {
    const srcFolder = react.getSrcFolder();
    node.addPackages({
      '@headlessui/react': '1.7.15',
      '@hookform/resolvers': '3.1.1',
      classnames: '2.3.2',
      'react-hook-form': '7.45.0',
      'react-hot-toast': '2.4.1',
      'react-icons': '4.10.1',
      'react-select': '5.7.4',
    });
    const [useStatusImport, useStatusPath] = makeImportAndFilePath(
      `${srcFolder}/hooks/useStatus.ts`,
    );
    const [useToastImport, useToastPath] = makeImportAndFilePath(
      `${srcFolder}/hooks/useToast.tsx`,
    );
    const coreReactComponents = [...REACT_COMPONENTS];

    if (includeDatePicker) {
      coreReactComponents.push({ name: 'ReactDatePickerInput' });
      node.addPackages({
        'react-datepicker': '4.16.0',
        'date-fns': '2.30.0',
      });
      node.addDevPackages({
        '@types/react-datepicker': '4.11.2',
      });
    }

    const allReactComponents = [...coreReactComponents];

    // add toaster root sibling component
    reactApp.addRenderSibling(
      TypescriptCodeUtils.createExpression(
        '<Toaster />',
        "import { Toaster } from 'react-hot-toast';",
      ),
    );

    return {
      getProviders: () => ({
        reactComponents: {
          registerComponent: (entry) => allReactComponents.push(entry),
          getComponentsFolder: () => `${srcFolder}/components`,
          getComponentsImport: () => `@/${srcFolder}/components`,
          getImportMap: () => ({
            '%react-components': {
              path: `@/${srcFolder}/components`,
              allowedImports: coreReactComponents.map((entry) => entry.name),
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
          coreReactComponents.map(async ({ name }) =>
            builder.apply(
              copyTypescriptFileAction({
                source: `components/${name}/index.tsx`,
                destination: `${srcFolder}/components/${name}/index.tsx`,
              }),
            ),
          ),
        );
        await builder.apply(
          copyTypescriptFileAction({
            source: 'hooks/useStatus.ts',
            destination: useStatusPath,
          }),
        );

        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useToast.tsx',
            destination: useToastPath,
            replacements: {
              COMPONENT_FOLDER: `@/${srcFolder}/components`,
            },
          }),
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
          }),
        );
      },
    };
  },
});

export default ReactComponentsGenerator;
