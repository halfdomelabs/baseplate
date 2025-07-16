import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

import { BULL_BULL_MQ_PATHS } from './template-paths.js';
import { BULL_BULL_MQ_TEMPLATES } from './typed-templates.js';

export interface BullBullMqRenderers {
  scriptsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof BULL_BULL_MQ_TEMPLATES.scriptsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  serviceGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof BULL_BULL_MQ_TEMPLATES.serviceGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const bullBullMqRenderers = createProviderType<BullBullMqRenderers>(
  'bull-bull-mq-renderers',
);

const bullBullMqRenderersTask = createGeneratorTask({
  dependencies: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: BULL_BULL_MQ_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { bullBullMqRenderers: bullBullMqRenderers.export() },
  run({
    errorHandlerServiceImports,
    fastifyRedisImports,
    loggerServiceImports,
    paths,
    typescriptFile,
  }) {
    return {
      providers: {
        bullBullMqRenderers: {
          scriptsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: BULL_BULL_MQ_TEMPLATES.scriptsGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
                  loggerServiceImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          serviceGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: BULL_BULL_MQ_TEMPLATES.serviceGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
                  fastifyRedisImports,
                  loggerServiceImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const BULL_BULL_MQ_RENDERERS = {
  provider: bullBullMqRenderers,
  task: bullBullMqRenderersTask,
};
