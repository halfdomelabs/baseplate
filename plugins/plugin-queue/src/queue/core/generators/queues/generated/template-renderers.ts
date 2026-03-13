import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { QUEUE_CORE_QUEUES_PATHS } from './template-paths.js';
import { QUEUE_CORE_QUEUES_TEMPLATES } from './typed-templates.js';

export interface QueueCoreQueuesRenderers {
  embeddedWorkersPlugin: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof QUEUE_CORE_QUEUES_TEMPLATES.embeddedWorkersPlugin
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
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
  workersService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof QUEUE_CORE_QUEUES_TEMPLATES.workersService
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
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: QUEUE_CORE_QUEUES_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { queueCoreQueuesRenderers: queueCoreQueuesRenderers.export() },
  run({
    configServiceImports,
    errorHandlerServiceImports,
    loggerServiceImports,
    paths,
    typescriptFile,
  }) {
    return {
      providers: {
        queueCoreQueuesRenderers: {
          embeddedWorkersPlugin: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: QUEUE_CORE_QUEUES_TEMPLATES.embeddedWorkersPlugin,
                destination: paths.embeddedWorkersPlugin,
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                  loggerServiceImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
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
          workersService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: QUEUE_CORE_QUEUES_TEMPLATES.workersService,
                destination: paths.workersService,
                importMapProviders: {
                  errorHandlerServiceImports,
                },
                generatorPaths: paths,
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
