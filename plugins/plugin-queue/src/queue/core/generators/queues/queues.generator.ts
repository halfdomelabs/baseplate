import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { packageScope, TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
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
