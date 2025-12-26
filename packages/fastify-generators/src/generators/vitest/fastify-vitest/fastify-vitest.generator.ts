import {
  createNodeTask,
  eslintConfigProvider,
  extractPackageVersions,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

const descriptorSchema = z.object({});

export const fastifyVitestGenerator = createGenerator({
  name: 'vitest/fastify-vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    node: createNodeTask((node) => {
      node.scripts.mergeObj({
        'test:unit': 'cross-env TEST_MODE=unit vitest run .unit.',
      });
      node.packages.addDevPackages(
        extractPackageVersions(FASTIFY_PACKAGES, ['cross-env']),
      );
    }),
    eslint: createGeneratorTask({
      dependencies: {
        eslintConfig: eslintConfigProvider,
      },
      run({ eslintConfig }) {
        eslintConfig.tsDefaultProjectFiles.push('vitest.config.ts');
      },
    }),
  }),
});
