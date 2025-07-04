import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/generated/ts-import-providers.js';
import { pothosImportsProvider } from '#src/generators/pothos/pothos/generated/ts-import-providers.js';

import { BULL_FASTIFY_BULL_BOARD_PATHS } from './template-paths.js';
import { BULL_FASTIFY_BULL_BOARD_TEMPLATES } from './typed-templates.js';

export interface BullFastifyBullBoardRenderers {
  moduleGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof BULL_FASTIFY_BULL_BOARD_TEMPLATES.moduleGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
}

const bullFastifyBullBoardRenderers =
  createProviderType<BullFastifyBullBoardRenderers>(
    'bull-fastify-bull-board-renderers',
  );

const bullFastifyBullBoardRenderersTask = createGeneratorTask({
  dependencies: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
    paths: BULL_FASTIFY_BULL_BOARD_PATHS.provider,
    pothosImports: pothosImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    bullFastifyBullBoardRenderers: bullFastifyBullBoardRenderers.export(),
  },
  run({
    errorHandlerServiceImports,
    fastifyRedisImports,
    paths,
    pothosImports,
    typescriptFile,
  }) {
    return {
      providers: {
        bullFastifyBullBoardRenderers: {
          moduleGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: BULL_FASTIFY_BULL_BOARD_TEMPLATES.moduleGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
                  fastifyRedisImports,
                  pothosImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const BULL_FASTIFY_BULL_BOARD_RENDERERS = {
  provider: bullFastifyBullBoardRenderers,
  task: bullFastifyBullBoardRenderersTask,
};
