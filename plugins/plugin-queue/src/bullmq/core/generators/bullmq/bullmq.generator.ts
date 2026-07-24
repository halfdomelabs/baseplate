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
        fastifyServerConfig.plugins.set('bullMQPlugin', {
          plugin: tsCodeFragment(
            'bullMQPlugin',
            tsImportBuilder(['bullMQPlugin']).from(paths.bullmqPlugin),
          ),
          options: tsCodeFragment('{ runtime }'),
        });
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
        appRuntimeConfig.construction.set('queues', {
          orderPriority: 'EARLY',
          fragment: TsCodeUtils.template`
            const { queues: queueBindings = [] } = ${appModuleSetupImports.flattenAppModule.fragment()}(${appModuleImports.getModuleFragment()});
            const queues = ${TsCodeUtils.importFragment('createQueueRuntime', paths.bullmqService)}(queueBindings);
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
