import { nodeProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactTailwindProvider } from '../react-tailwind/index.js';

const libraryImportSchema = z.object({
  packageName: z.string(),
  /**
   * Path to the library's `src` directory, relative to the app's `src` root
   * (where `styles.css` is rendered), e.g. `../../../libs/ui-shared/src`.
   */
  relativeSourceGlob: z.string(),
});

const descriptorSchema = z.object({
  libraries: z.array(libraryImportSchema),
});

/**
 * Generator for wiring up an app's imports of `react-library` packages.
 *
 * For each imported library, adds a `workspace:*` dependency on the library's
 * package and registers its source directory with the app's Tailwind config
 * so classes used in the library's source are scanned and compiled.
 */
export const reactLibraryImportsGenerator = createGenerator({
  name: 'core/react-library-imports',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ libraries }) => ({
    main: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        reactTailwind: reactTailwindProvider,
      },
      run({ node, reactTailwind }) {
        for (const { packageName, relativeSourceGlob } of libraries) {
          node.packages.addPackages({
            prod: { [packageName]: 'workspace:*' },
          });
          reactTailwind.addSourceGlob(relativeSourceGlob);
        }
      },
    }),
  }),
});
