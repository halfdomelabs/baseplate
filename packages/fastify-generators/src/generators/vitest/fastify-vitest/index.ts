import {
  createNodeTask,
  projectScope,
  TypescriptCodeUtils,
  vitestProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type FastifyVitestProvider = unknown;

export const fastifyVitestProvider =
  createProviderType<FastifyVitestProvider>('fastify-vitest');

export const fastifyVitestGenerator = createGenerator({
  name: 'vitest/fastify-vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    node: createNodeTask((node, { taskId }) => {
      node.scripts.mergeObj(
        {
          test: 'vitest run',
          'test:unit': 'cross-env TEST_MODE=unit vitest run .unit.',
        },
        taskId,
      );
    }),
    main: createGeneratorTask({
      dependencies: {
        vitest: vitestProvider,
      },
      exports: {
        fastifyVitest: fastifyVitestProvider.export(projectScope),
      },
      run({ vitest }) {
        // add config to vitest setup

        vitest
          .getConfig()
          .appendUnique('customSetupBlocks', [
            TypescriptCodeUtils.createBlock(
              'config()',
              "import { config } from 'dotenv'",
            ),
          ]);

        return {
          providers: {
            fastifyVitest: {},
          },
        };
      },
    }),
  }),
});
