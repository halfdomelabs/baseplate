import {
  createNodeTask,
  tsCodeFragment,
  tsImportBuilder,
  vitestConfigProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

export const fastifyVitestGenerator = createGenerator({
  name: 'vitest/fastify-vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    node: createNodeTask((node) => {
      node.scripts.mergeObj({
        test: 'vitest run',
        'test:unit': 'cross-env TEST_MODE=unit vitest run .unit.',
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        vitestConfig: vitestConfigProvider,
      },
      run({ vitestConfig }) {
        // add config to vitest setup

        vitestConfig.globalSetupOperations.set(
          'dotenv',
          tsCodeFragment(
            'config()',
            tsImportBuilder(['config']).from('dotenv'),
          ),
        );
      },
    }),
  }),
});
