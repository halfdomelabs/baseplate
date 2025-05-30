import {
  createNodePackagesTask,
  extractPackageVersions,
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

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

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

export interface ReactComponentsProvider {
  /**
   * Registers component entry so it gets exported by root index component
   *
   * @param entry Component entry to register
   */
  registerComponent(entry: ReactComponentEntry): void;
  /**
   * Get the canonical path to the components folder, e.g. `@/src/components`
   */
  getComponentsFolder(): string;
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
              getComponentsFolder: () => `@/src/components`,
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

            if (includeDatePicker) {
              await builder.apply(
                typescriptFile.renderTemplateFile({
                  template:
                    CORE_REACT_COMPONENTS_TS_TEMPLATES.reactDatePickerInput,
                  destination: `src/components/ReactDatePickerInput/index.tsx`,
                }),
              );
            }

            // build component index
            const componentNames = allReactComponents
              .toSorted((a, b) => a.name.localeCompare(b.name))
              .map((entry) => entry.name);
            const componentIndex = componentNames
              .map((name) => `export { default as ${name} } from './${name}';`)
              .join('\n');
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_COMPONENTS_TS_TEMPLATES.index,
                destination: `src/components/index.ts`,
                variables: {
                  TPL_EXPORTS: componentIndex,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export {
  reactComponentsImportsProvider,
  type ReactComponentsImportsProvider,
} from './generated/ts-import-maps.js';
