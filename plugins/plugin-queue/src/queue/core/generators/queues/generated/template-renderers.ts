import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { QUEUE_CORE_QUEUES_PATHS } from './template-paths.js';
import { QUEUE_CORE_QUEUES_TEMPLATES } from './typed-templates.js';

export interface QueueCoreQueuesRenderers {
  queueRegistry: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof QUEUE_CORE_QUEUES_TEMPLATES.queueRegistry
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
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
    typescriptFile: typescriptFileProvider,
  },
  exports: { queueCoreQueuesRenderers: queueCoreQueuesRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        queueCoreQueuesRenderers: {
          queueRegistry: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: QUEUE_CORE_QUEUES_TEMPLATES.queueRegistry,
                destination: paths.queueRegistry,
                generatorPaths: paths,
                ...options,
              }),
          },
          queueTypes: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: QUEUE_CORE_QUEUES_TEMPLATES.queueTypes,
                destination: paths.queueTypes,
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
