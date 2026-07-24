import {
  nodeProvider,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appModuleImportsProvider,
  appModuleSetupImportsProvider,
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
          options: tsCodeFragment('{ runtime }'),
        });
        fastifyServerConfig.runtimeConstructionOptions.set(
          tsCodeFragment(
            '{ disableQueueMaintenance: !config.ENABLE_EMBEDDED_WORKERS }',
          ),
        );
      },
    }),
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        appModuleImports: appModuleImportsProvider,
        appModuleSetupImports: appModuleSetupImportsProvider,
        queuesImports: queuesImportsProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({
        appRuntimeConfig,
        appModuleImports,
        appModuleSetupImports,
        queuesImports,
        paths,
      }) {
        appRuntimeConfig.services.set(
          'queues',
          queuesImports.QueueService.typeFragment(),
        );
        appRuntimeConfig.runtimeFields.set(
          'queues',
          queuesImports.QueueRuntime.typeFragment(),
        );
        appRuntimeConfig.constructionOptions.set(
          'disableQueueMaintenance?',
          tsCodeFragment('boolean'),
        );
        appRuntimeConfig.construction.set('queues', {
          orderPriority: 'EARLY',
          fragment: TsCodeUtils.template`
            const { queues: queueBindings = [] } = ${appModuleSetupImports.flattenAppModule.fragment()}(${appModuleImports.getModuleFragment()});
            const queues = ${TsCodeUtils.importFragment('createQueueRuntime', paths.pgBossService)}(queueBindings, {
              disableMaintenance: options.disableQueueMaintenance,
            });
            disposers.push({ name: 'queues', dispose: () => queues.stopWorkers() });
          `,
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
