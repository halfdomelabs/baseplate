import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { reactAppConfigProvider } from '../react-app/index.js';
import { CORE_REACT_COMPONENTS_GENERATED } from './generated/index.js';
import { reactComponentsImportsProvider } from './generated/ts-import-providers.js';

const descriptorSchema = z.object({});

export interface ReactComponentEntry {
  name: string;
}

export interface ReactComponentsProvider {
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
    renderers: CORE_REACT_COMPONENTS_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: CORE_REACT_COMPONENTS_GENERATED.renderers.provider,
        reactAppConfig: reactAppConfigProvider,
        reactComponentsImports: reactComponentsImportsProvider,
      },
      run({ renderers, reactAppConfig, reactComponentsImports }) {
        // add toaster root sibling component
        reactAppConfig.renderSiblings.set(
          'toaster',
          tsCodeFragment(
            '<Toaster />',
            reactComponentsImports.Toaster.declaration(),
          ),
        );

        // add confirm dialog root sibling component
        reactAppConfig.renderSiblings.set(
          'react-components',
          tsCodeFragment(
            '<ConfirmDialog />',
            reactComponentsImports.ConfirmDialog.declaration(),
          ),
        );

        return {
          providers: {
            reactComponents: {
              getComponentsFolder: () => `@/src/components`,
            },
          },
          build: async (builder) => {
            await builder.apply(
              renderers.componentsGroup.render({}),
              renderers.hooksGroup.render({}),
              renderers.stylesGroup.render({}),
              renderers.utilsGroup.render({}),
            );
          },
        };
      },
    }),
  }),
});
