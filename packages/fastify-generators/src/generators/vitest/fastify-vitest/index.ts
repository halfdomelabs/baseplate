import {
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
  vitestProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
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
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        vitest: vitestProvider,
        node: nodeProvider,
      },
      exports: {
        fastifyVitest: fastifyVitestProvider.export(projectScope),
      },
      run({ node, vitest }) {
        // add config to vitest setup

        vitest
          .getConfig()
          .appendUnique('customSetupBlocks', [
            TypescriptCodeUtils.createBlock(
              'config()',
              "import { config } from 'dotenv'",
            ),
          ]);

        node.addScript('test', 'vitest run');
        node.addScript(
          'test:unit',
          'cross-env TEST_MODE=unit vitest run .unit.',
        );

        return {
          getProviders: () => ({
            fastifyVitest: {},
          }),
        };
      },
    });
  },
});
