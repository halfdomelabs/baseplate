import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { RATE_LIMIT_CORE_RATE_LIMIT_PATHS } from './template-paths.js';
import { RATE_LIMIT_CORE_RATE_LIMIT_TEMPLATES } from './typed-templates.js';

export interface RateLimitCoreRateLimitRenderers {
  rateLimiterService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof RATE_LIMIT_CORE_RATE_LIMIT_TEMPLATES.rateLimiterService
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  typesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof RATE_LIMIT_CORE_RATE_LIMIT_TEMPLATES.typesGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const rateLimitCoreRateLimitRenderers =
  createProviderType<RateLimitCoreRateLimitRenderers>(
    'rate-limit-core-rate-limit-renderers',
  );

const rateLimitCoreRateLimitRenderersTask = createGeneratorTask({
  dependencies: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: RATE_LIMIT_CORE_RATE_LIMIT_PATHS.provider,
    prismaImports: prismaImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    rateLimitCoreRateLimitRenderers: rateLimitCoreRateLimitRenderers.export(),
  },
  run({ errorHandlerServiceImports, paths, prismaImports, typescriptFile }) {
    return {
      providers: {
        rateLimitCoreRateLimitRenderers: {
          rateLimiterService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  RATE_LIMIT_CORE_RATE_LIMIT_TEMPLATES.rateLimiterService,
                destination: paths.rateLimiterService,
                importMapProviders: {
                  errorHandlerServiceImports,
                  prismaImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          typesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: RATE_LIMIT_CORE_RATE_LIMIT_TEMPLATES.typesGroup,
                paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const RATE_LIMIT_CORE_RATE_LIMIT_RENDERERS = {
  provider: rateLimitCoreRateLimitRenderers,
  task: rateLimitCoreRateLimitRenderersTask,
};
