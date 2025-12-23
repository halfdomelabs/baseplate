import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  fastifyRedisImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { queuesImportsProvider } from '#src/queue/core/generators/queues/generated/ts-import-providers.js';

import { BULLMQ_CORE_BULLMQ_PATHS } from './template-paths.js';
import { BULLMQ_CORE_BULLMQ_TEMPLATES } from './typed-templates.js';

export interface BullmqCoreBullmqRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof BULLMQ_CORE_BULLMQ_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const bullmqCoreBullmqRenderers = createProviderType<BullmqCoreBullmqRenderers>(
  'bullmq-core-bullmq-renderers',
);

const bullmqCoreBullmqRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: BULLMQ_CORE_BULLMQ_PATHS.provider,
    queuesImports: queuesImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { bullmqCoreBullmqRenderers: bullmqCoreBullmqRenderers.export() },
  run({
    configServiceImports,
    errorHandlerServiceImports,
    fastifyRedisImports,
    loggerServiceImports,
    paths,
    queuesImports,
    typescriptFile,
  }) {
    return {
      providers: {
        bullmqCoreBullmqRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: BULLMQ_CORE_BULLMQ_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                  fastifyRedisImports,
                  loggerServiceImports,
                  queuesImports,
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

export const BULLMQ_CORE_BULLMQ_RENDERERS = {
  provider: bullmqCoreBullmqRenderers,
  task: bullmqCoreBullmqRenderersTask,
};
