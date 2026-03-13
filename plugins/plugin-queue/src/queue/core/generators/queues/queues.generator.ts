import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
} from '@baseplate-dev/core-generators';
import { configServiceProvider } from '@baseplate-dev/fastify-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { QUEUE_CORE_QUEUES_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

const [configTask, queueConfigProvider, queueConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      queues: t.map<string, TsCodeFragment>(),
    }),
    {
      prefix: 'queue',
      configScope: packageScope,
    },
  );

export { queueConfigProvider };

/**
 * Generator for queue/core/queues
 */
export const queuesGenerator = createGenerator({
  name: 'queue/core/queues',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    imports: GENERATED_TEMPLATES.imports.task,
    config: configTask,
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
        configService.configFields.set('ENABLE_EMBEDDED_WORKERS', {
          comment:
            'Enable embedded workers (run queue workers in the API process)',
          validator: tsCodeFragment('z.stringbool().optional()'),
          exampleValue: 'false',
        });
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
        configValues: queueConfigValuesProvider,
      },
      run({ renderers, configValues: { queues } }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.queueRegistry.render({
                variables: {
                  TPL_QUEUE_LIST: TsCodeUtils.mergeFragmentsAsArray(queues),
                },
              }),
            );
            await builder.apply(
              renderers.queueTypes.render({
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
