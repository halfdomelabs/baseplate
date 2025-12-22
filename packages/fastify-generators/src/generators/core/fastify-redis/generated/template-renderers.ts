import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

import { CORE_FASTIFY_REDIS_PATHS } from './template-paths.js';
import { CORE_FASTIFY_REDIS_TEMPLATES } from './typed-templates.js';

export interface CoreFastifyRedisRenderers {
  redis: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_FASTIFY_REDIS_TEMPLATES.redis
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreFastifyRedisRenderers = createProviderType<CoreFastifyRedisRenderers>(
  'core-fastify-redis-renderers',
);

const coreFastifyRedisRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    paths: CORE_FASTIFY_REDIS_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreFastifyRedisRenderers: coreFastifyRedisRenderers.export() },
  run({ configServiceImports, paths, typescriptFile }) {
    return {
      providers: {
        coreFastifyRedisRenderers: {
          redis: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_REDIS_TEMPLATES.redis,
                destination: paths.redis,
                importMapProviders: {
                  configServiceImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_FASTIFY_REDIS_RENDERERS = {
  provider: coreFastifyRedisRenderers,
  task: coreFastifyRedisRenderersTask,
};
