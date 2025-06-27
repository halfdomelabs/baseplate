import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { kebabCase } from 'es-toolkit';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { reactAppConfigProvider } from '../react-app/index.js';
import { CORE_REACT_COMPONENTS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

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
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, [
        '@headlessui/react',
        '@hookform/resolvers',
        'clsx',
        'react-hook-form',
        'react-icons',
        'zustand',
        'radix-ui',
        'class-variance-authority',
        'cmdk',
        'sonner',
        'react-day-picker',
        'date-fns',
      ]),
    }),
    paths: CORE_REACT_COMPONENTS_GENERATED.paths.task,
    imports: CORE_REACT_COMPONENTS_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactAppConfig: reactAppConfigProvider,
        paths: CORE_REACT_COMPONENTS_GENERATED.paths.provider,
      },
      exports: {
        reactComponents: reactComponentsProvider.export(packageScope),
      },
      run({ typescriptFile, reactAppConfig, paths }) {
        const coreReactComponents = Object.keys(
          CORE_REACT_COMPONENTS_GENERATED.templates.componentsGroup,
        ).map(
          (name): ReactComponentEntry => ({
            name: kebabCase(name).replace('-component', ''),
          }),
        );

        const allReactComponents = [...coreReactComponents];

        // add toaster root sibling component
        reactAppConfig.renderSiblings.set(
          'toaster',
          tsCodeFragment(
            '<Toaster />',
            tsImportBuilder(['Toaster']).from(paths.index),
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
              typescriptFile.renderTemplateGroup({
                group:
                  CORE_REACT_COMPONENTS_GENERATED.templates.componentsGroup,
                paths,
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: CORE_REACT_COMPONENTS_GENERATED.templates.hooksGroup,
                paths,
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: CORE_REACT_COMPONENTS_GENERATED.templates.stylesGroup,
                paths,
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: CORE_REACT_COMPONENTS_GENERATED.templates.utilsGroup,
                paths,
              }),
            );

            // build component index
            const getComponentPath = (a: ReactComponentEntry): string =>
              `./${a.name}/${a.name}.js`;

            const sortedComponentPaths = allReactComponents
              .map(getComponentPath)
              .toSorted();

            // build component index
            const componentIndex = sortedComponentPaths
              .map((path) => `export * from '${path}';`)
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
