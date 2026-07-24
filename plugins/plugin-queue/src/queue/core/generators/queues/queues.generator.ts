import {
  tsCodeFragment,
  tsTypeImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appModuleConfigProvider,
  configServiceProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { QUEUE_CORE_QUEUES_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

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
    appModuleConfig: createGeneratorTask({
      dependencies: {
        appModuleConfig: appModuleConfigProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ appModuleConfig, paths }) {
        appModuleConfig.moduleFields.set(
          'queues',
          tsCodeFragment(
            'QueueHandlerBinding',
            tsTypeImportBuilder(['QueueHandlerBinding']).from(paths.queueTypes),
          ),
        );
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
