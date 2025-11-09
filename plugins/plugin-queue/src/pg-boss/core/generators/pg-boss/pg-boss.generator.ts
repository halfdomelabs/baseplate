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

import { PG_BOSS_CORE_PG_BOSS_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  deleteAfterDays: z.number().min(1).default(7),
});

/**
 * Generator for the pg-boss service
 */
export const pgBossGenerator = createGenerator({
  name: 'pg-boss/core/pg-boss',
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
        fastifyServerConfig.plugins.set('pgBossPlugin', {
          plugin: tsCodeFragment(
            'pgBossPlugin',
            tsImportBuilder(['pgBossPlugin']).from(paths.pgBossPlugin),
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
            'src/scripts/run-workers.ts',
            'prod',
            { executable: 'tsx' },
          ),
        });

        node.packages.addProdPackages({
          'pg-boss': '11.1.1',
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
                  pgBossService: {
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
