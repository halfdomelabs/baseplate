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
  { name: 'ConfirmDialog' },
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
      '@headlessui/react': '1.7.18',
      '@hookform/resolvers': '3.9.0',
      clsx: '2.1.1',
      'react-hook-form': '7.53.0',
      'react-hot-toast': '2.4.1',
      'react-icons': '5.0.1',
      'react-select': '5.8.0',
      zustand: '4.4.6',
    });
    const [useStatusImport, useStatusPath] = makeImportAndFilePath(
      `${srcFolder}/hooks/useStatus.ts`,
    );
    const [useToastImport, useToastPath] = makeImportAndFilePath(
      `${srcFolder}/hooks/useToast.tsx`,
    );
    const [useConfirmDialogImport, useConfirmDialogPath] =
      makeImportAndFilePath(`${srcFolder}/hooks/useConfirmDialog.ts`);

    const coreReactComponents = [...REACT_COMPONENTS];

    if (includeDatePicker) {
      coreReactComponents.push({ name: 'ReactDatePickerInput' });
      node.addPackages({
        'react-datepicker': '4.25.0',
        'date-fns': '3.2.0',
      });
      node.addDevPackages({
        '@types/react-datepicker': '4.19.5',
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

    // add confirm dialog root sibling component
    reactApp.addRenderSibling(
      TypescriptCodeUtils.createExpression(
        '<ConfirmDialog />',
        `import { ConfirmDialog } from "@/${srcFolder}/components";`,
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
            '%react-components/useConfirmDialog': {
              path: useConfirmDialogImport,
              allowedImports: ['useConfirmDialog'],
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

        await builder.apply(
          typescript.createCopyAction({
            source: 'hooks/useConfirmDialog.ts',
            destination: useConfirmDialogPath,
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
