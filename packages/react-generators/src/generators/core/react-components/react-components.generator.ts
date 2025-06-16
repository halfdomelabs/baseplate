import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { pascalCase } from 'es-toolkit';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { reactAppConfigProvider } from '../react-app/index.js';
import { CORE_REACT_COMPONENTS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  includeDatePicker: z.boolean().optional(),
});

export interface ReactComponentEntry {
  name: string;
}

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
    paths: CORE_REACT_COMPONENTS_GENERATED.paths.task,
    imports: CORE_REACT_COMPONENTS_GENERATED.imports.task,
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
        paths: CORE_REACT_COMPONENTS_GENERATED.paths.provider,
      },
      exports: {
        reactComponents: reactComponentsProvider.export(projectScope),
      },
      run({ typescriptFile, reactAppConfig, paths }) {
        const coreReactComponents = Object.keys(
          CORE_REACT_COMPONENTS_GENERATED.templates.componentsGroup,
        ).map((name) => ({ name: pascalCase(name) }));

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
            tsImportBuilder(['ConfirmDialog']).from(paths.index),
          ),
        );

        return {
          providers: {
            reactComponents: {
              registerComponent: (entry) => allReactComponents.push(entry),
              getComponentsFolder: () => `@/src/components`,
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroupV2({
                group:
                  CORE_REACT_COMPONENTS_GENERATED.templates.componentsGroup,
                paths,
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateGroupV2({
                group: CORE_REACT_COMPONENTS_GENERATED.templates.hooksGroup,
                paths,
              }),
            );

            if (includeDatePicker) {
              await builder.apply(
                typescriptFile.renderTemplateFile({
                  template:
                    CORE_REACT_COMPONENTS_GENERATED.templates
                      .reactDatePickerInput,
                  destination: paths.reactDatePickerInput,
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
                template: CORE_REACT_COMPONENTS_GENERATED.templates.index,
                destination: paths.index,
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
