import {
  createNodePackagesTask,
  extractPackageVersions,
  vitestConfigProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  normalizePathToOutputPath,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { VITEST_REACT_VITEST_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Configures Vitest to run React component tests in a DOM environment with
 * Testing Library.
 */
export const reactVitestGenerator = createGenerator({
  name: 'vitest/react-vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(REACT_PACKAGES, [
        '@testing-library/jest-dom',
        '@testing-library/react',
        '@testing-library/user-event',
        'jsdom',
      ]),
    }),
    paths: VITEST_REACT_VITEST_GENERATED.paths.task,
    renderers: VITEST_REACT_VITEST_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: VITEST_REACT_VITEST_GENERATED.renderers.provider,
        vitestConfig: vitestConfigProvider,
        paths: VITEST_REACT_VITEST_GENERATED.paths.provider,
      },
      run({ renderers, vitestConfig, paths }) {
        vitestConfig.environment.set('jsdom');

        return {
          build: async (builder) => {
            await builder.apply(renderers.setup.render({}));
            vitestConfig.setupFiles.push(
              normalizePathToOutputPath(paths.setup),
            );
          },
        };
      },
    }),
  }),
});
