import {
  nodeProvider,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appRuntimeConfigProvider,
  fastifyOutputProvider,
  fastifyProvider,
  fastifyServerConfigProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { queuesImportsProvider } from '#src/queue/core/generators/queues/index.js';

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
          options: tsCodeFragment('{ services }'),
        });
        fastifyServerConfig.runtimeConstructionOptions.set(
          tsCodeFragment(
            '{ backgroundServices: config.ENABLE_EMBEDDED_WORKERS }',
          ),
        );
      },
    }),
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        queuesImports: queuesImportsProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ appRuntimeConfig, queuesImports, paths }) {
        appRuntimeConfig.services.set(
          'queue',
          queuesImports.QueueRuntime.typeFragment(),
        );
        appRuntimeConfig.flattenedModuleFields.set('queues', 'queueBindings');
        // `supervise`/`schedule` are constructor options and any enqueue calls
        // `boss.start()`, so the loops need gating at construction rather than
        // at worker startup.
        appRuntimeConfig.usesBackgroundServices.set(true);
        appRuntimeConfig.construction.set('queue', {
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createQueueRuntime', paths.pgBossService)}(queueBindings, {
            disableMaintenance: !options.backgroundServices,
          })`,
          disposeFragment: tsCodeFragment('(queue) => queue.stopWorkers()'),
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
            'dist/scripts/run-workers.js',
            'prod',
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
