import {
  nodeProvider,
  tsCodeFragment,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  fastifyOutputProvider,
  fastifyProvider,
  fastifyServerConfigProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { BULLMQ_CORE_BULLMQ_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  deleteAfterDays: z.number().min(1).default(7),
});

/**
 * Generator for the BullMQ service
 */
export const bullmqGenerator = createGenerator({
  name: 'bullmq/core/bullmq',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ deleteAfterDays }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    imports: GENERATED_TEMPLATES.imports.task,
    fastifyServerConfig: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ fastifyServerConfig, paths }) {
        fastifyServerConfig.plugins.set('bullmqPlugin', {
          plugin: tsCodeFragment(
            'bullMQPlugin',
            tsImportBuilder(['bullMQPlugin']).from(paths.bullmqPlugin),
          ),
        });
      },
    }),
    fastify: createGeneratorTask({
      dependencies: {
        fastify: fastifyProvider,
      },
      run({ fastify }) {
        fastify.enableParallelDevCommand.set(true);
      },
    }),
    node: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
      },
      run({ node, fastifyOutput }) {
        node.scripts.mergeObj({
          'dev:workers': fastifyOutput.getNodeCommand(
            'src/scripts/run-workers.ts',
            'dev',
          ),
          'start:workers': fastifyOutput.getNodeCommand(
            'dist/scripts/run-workers.ts',
            'prod',
          ),
        });

        node.packages.addProdPackages({
          bullmq: '5.61.2',
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.mainGroup.render({
                variables: {
                  bullmqService: {
                    TPL_DELETE_AFTER_DAYS: String(deleteAfterDays),
                  },
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
