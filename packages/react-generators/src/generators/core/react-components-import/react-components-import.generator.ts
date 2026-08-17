import {
  createNodePackagesTask,
  createTsImportMap,
  extractPackageVersions,
  nodeProvider,
  packageImportsProvider,
  packageScope,
  tsCodeFragment,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { reactAppConfigProvider } from '../react-app/index.js';
import {
  CORE_REACT_COMPONENTS_IMPORTS,
  reactComponentsImportsSchema,
} from '../react-components/generated/ts-import-providers.js';
import { reactComponentsImportsProvider } from '../react-components/index.js';
import { reactTailwindProvider } from '../react-tailwind/index.js';

const descriptorSchema = z.object({
  packageName: z.string(),
  /**
   * Path to the library's `src` directory, relative to the app's `src` root
   * (where `styles.css` is rendered), e.g. `../../../libs/ui-shared/src`.
   */
  relativeSourceGlob: z.string(),
});

/**
 * Generator for sourcing the `react-components` UI primitive set (Button,
 * Dialog, Toaster, etc.) from an imported `react-library` package instead of
 * generating them locally in the app.
 *
 * Wires the same `workspace:*` dependency + Tailwind source-glob mechanics as
 * `reactLibraryImportsGenerator`, and exports a `reactComponentsImportsProvider`
 * whose entries all resolve to the library's package name — every existing
 * consumer generator (admin-crud, auth, notifications, storage, etc.) works
 * unmodified since the provider contract is identical to the local-mode one.
 */
export const reactComponentsImportGenerator = createGenerator({
  name: 'core/react-components-import',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ packageName, relativeSourceGlob }) => ({
    // These are imported directly by app-side generated templates (admin-crud
    // forms, auth pages, `toast()` calls, sidebar/notification icons), not
    // just re-exported through `reactComponentsImportsProvider`, so the app
    // still needs them even though the components themselves live in the
    // library.
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, [
        'react-hook-form',
        'sonner',
        '@hookform/resolvers',
        'react-icons',
      ]),
    }),
    wiring: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        packageImports: packageImportsProvider,
        reactTailwind: reactTailwindProvider,
      },
      run({ node, packageImports, reactTailwind }) {
        node.packages.addPackages({
          prod: { [packageName]: 'workspace:*' },
        });
        reactTailwind.addSourceGlob(relativeSourceGlob);
        // Templates rendered into the app import these components by the library's package
        // name, which is project-specific; declaring it lets extraction map those imports
        // back to `reactComponentsImportsProvider` instead of rejecting them.
        packageImports.registerPackageImportProvider({
          moduleSpecifier: packageName,
          generatorName: CORE_REACT_COMPONENTS_IMPORTS.generatorName,
        });
      },
    }),
    imports: createGeneratorTask({
      exports: {
        reactComponentsImports:
          reactComponentsImportsProvider.export(packageScope),
      },
      run() {
        const importsInput = Object.fromEntries(
          Object.keys(reactComponentsImportsSchema).map((key) => [
            key,
            packageName,
          ]),
        ) as Record<keyof typeof reactComponentsImportsSchema, string>;
        const imports = createTsImportMap(
          reactComponentsImportsSchema,
          importsInput,
        );

        return {
          providers: {
            reactComponentsImports: imports,
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        reactAppConfig: reactAppConfigProvider,
        reactComponentsImports: reactComponentsImportsProvider,
      },
      run({ reactAppConfig, reactComponentsImports }) {
        reactAppConfig.renderSiblings.set(
          'toaster',
          tsCodeFragment(
            '<Toaster />',
            reactComponentsImports.Toaster.declaration(),
          ),
        );

        reactAppConfig.renderSiblings.set(
          'react-components',
          tsCodeFragment(
            '<ConfirmDialog />',
            reactComponentsImports.ConfirmDialog.declaration(),
          ),
        );
      },
    }),
  }),
});
