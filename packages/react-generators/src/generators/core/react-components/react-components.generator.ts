import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

import { reactAppConfigProvider } from '../react-app/react-app.generator.js';
import {
  createReactComponentsImports,
  reactComponentsImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_REACT_COMPONENTS_TS_TEMPLATES } from './generated/ts-templates.js';

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

export const reactComponentsGenerator = createGenerator({
  name: 'core/react-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ includeDatePicker }) => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, [
        '@headlessui/react',
        '@hookform/resolvers',
        'clsx',
        'react-hook-form',
        'react-hot-toast',
        'react-icons',
        'react-select',
        'zustand',
      ]),
    }),
    datePickerPackages: includeDatePicker
      ? createNodePackagesTask({
          prod: extractPackageVersions(REACT_PACKAGES, [
            'react-datepicker',
            'date-fns',
          ]),
          dev: extractPackageVersions(REACT_PACKAGES, [
            '@types/react-datepicker',
          ]),
        })
      : undefined,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactAppConfig: reactAppConfigProvider,
      },
      exports: {
        reactComponents: reactComponentsProvider.export(projectScope),
        reactComponentsImports:
          reactComponentsImportsProvider.export(projectScope),
      },
      run({ typescriptFile, reactAppConfig }) {
        const [useStatusImport] = makeImportAndFilePath(
          `src/hooks/useStatus.ts`,
        );
        const [useToastImport] = makeImportAndFilePath(
          `src/hooks/useToast.tsx`,
        );
        const [useConfirmDialogImport] = makeImportAndFilePath(
          `src/hooks/useConfirmDialog.ts`,
        );

        const coreReactComponents = [...REACT_COMPONENTS];

        if (includeDatePicker) {
          coreReactComponents.push({ name: 'ReactDatePickerInput' });
        }

        const allReactComponents = [...coreReactComponents];

        // add toaster root sibling component
        reactAppConfig.renderSiblings.set(
          'react-hot-toast',
          tsCodeFragment(
            '<Toaster />',
            tsImportBuilder(['Toaster']).from('react-hot-toast'),
          ),
        );

        // add confirm dialog root sibling component
        reactAppConfig.renderSiblings.set(
          'react-components',
          tsCodeFragment(
            '<ConfirmDialog />',
            tsImportBuilder(['ConfirmDialog']).from(
              '@/src/components/index.js',
            ),
          ),
        );

        return {
          providers: {
            reactComponents: {
              registerComponent: (entry) => allReactComponents.push(entry),
              getComponentsFolder: () => `src/components`,
              getComponentsImport: () => `@/src/components`,
              getImportMap: () => ({
                '%react-components': {
                  path: `@/src/components`,
                  allowedImports: coreReactComponents.map(
                    (entry) => entry.name,
                  ),
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
            reactComponentsImports: createReactComponentsImports('@/src'),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: CORE_REACT_COMPONENTS_TS_TEMPLATES.componentsGroup,
                baseDirectory: '@/src/components',
              }),
            );
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: CORE_REACT_COMPONENTS_TS_TEMPLATES.hooksGroup,
                baseDirectory: '@/src/hooks',
              }),
            );

            // build component index
            const componentNames = allReactComponents.map(
              (entry) => entry.name,
            );
            const componentIndex = componentNames
              .map((name) => `export { default as ${name} } from './${name}';`)
              .join('\n');
            builder.writeFile({
              id: `react-components-index`,
              contents: componentIndex,
              destination: `src/components/index.ts`,
            });
          },
        };
      },
    }),
  }),
});

export { reactComponentsImportsProvider } from './generated/ts-import-maps.js';
