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

const descriptorSchema = z.object({
  /**
   * Where the components are being rendered. In `library` mode they are rendered into a
   * `react-library` package rather than an app, so there is no app root to attach the
   * `Toaster`/`ConfirmDialog` siblings to.
   */
  mode: z.enum(['app', 'library']).default('app'),
});

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

const APP_PACKAGES = [
  '@hookform/resolvers',
  '@base-ui/react',
  'clsx',
  'react-hook-form',
  'react-icons',
  'zustand',
  'class-variance-authority',
  'sonner',
  'react-day-picker',
  'date-fns',
  // consumed by the `cn` helper this generator renders; in import mode the
  // helper lives in the component library, which declares its own copy
  'tailwind-merge',
] as const;

const LIBRARY_PACKAGES = APP_PACKAGES.filter(
  // the library re-exports form controllers but the resolvers are only needed by the app
  // code that builds the forms
  (packageName) => packageName !== '@hookform/resolvers',
);

export const reactComponentsGenerator = createGenerator({
  name: 'core/react-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ mode }) => ({
    nodePackages:
      mode === 'library'
        ? createNodePackagesTask({
            prod: extractPackageVersions(REACT_PACKAGES, [...LIBRARY_PACKAGES]),
            // `not-found-card.tsx` uses router hooks/components — a peer since a
            // second copy of the router in the tree would break navigation context
            peer: extractPackageVersions(REACT_PACKAGES, [
              '@tanstack/react-router',
            ]),
            dev: extractPackageVersions(REACT_PACKAGES, [
              '@tanstack/react-router',
            ]),
          })
        : createNodePackagesTask({
            prod: extractPackageVersions(REACT_PACKAGES, [...APP_PACKAGES]),
          }),
    paths: CORE_REACT_COMPONENTS_GENERATED.paths.task,
    imports: CORE_REACT_COMPONENTS_GENERATED.imports.task,
    renderers: CORE_REACT_COMPONENTS_GENERATED.renderers.task,
    main:
      mode === 'library'
        ? createGeneratorTask({
            dependencies: {
              renderers: CORE_REACT_COMPONENTS_GENERATED.renderers.provider,
            },
            run({ renderers }) {
              return {
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
          })
        : createGeneratorTask({
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
