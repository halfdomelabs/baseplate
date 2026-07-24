import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { serviceContextImportsProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { QUEUE_CORE_QUEUES_PATHS } from './template-paths.js';
import { QUEUE_CORE_QUEUES_TEMPLATES } from './typed-templates.js';

export interface QueueCoreQueuesRenderers {
  queueTypes: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof QUEUE_CORE_QUEUES_TEMPLATES.queueTypes
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const queueCoreQueuesRenderers = createProviderType<QueueCoreQueuesRenderers>(
  'queue-core-queues-renderers',
);

const queueCoreQueuesRenderersTask = createGeneratorTask({
  dependencies: {
    paths: QUEUE_CORE_QUEUES_PATHS.provider,
    serviceContextImports: serviceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { queueCoreQueuesRenderers: queueCoreQueuesRenderers.export() },
  run({ paths, serviceContextImports, typescriptFile }) {
    return {
      providers: {
        queueCoreQueuesRenderers: {
          queueTypes: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: QUEUE_CORE_QUEUES_TEMPLATES.queueTypes,
                destination: paths.queueTypes,
                importMapProviders: {
                  serviceContextImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const QUEUE_CORE_QUEUES_RENDERERS = {
  provider: queueCoreQueuesRenderers,
  task: queueCoreQueuesRenderersTask,
};
