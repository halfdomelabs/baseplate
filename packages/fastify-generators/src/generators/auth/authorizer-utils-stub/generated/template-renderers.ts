import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';

import { PRISMA_AUTHORIZER_UTILS_STUB_PATHS } from './template-paths.js';
import { PRISMA_AUTHORIZER_UTILS_STUB_TEMPLATES } from './typed-templates.js';

export interface PrismaAuthorizerUtilsStubRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof PRISMA_AUTHORIZER_UTILS_STUB_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const prismaAuthorizerUtilsStubRenderers =
  createProviderType<PrismaAuthorizerUtilsStubRenderers>(
    'prisma-authorizer-utils-stub-renderers',
  );

const prismaAuthorizerUtilsStubRenderersTask = createGeneratorTask({
  dependencies: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: PRISMA_AUTHORIZER_UTILS_STUB_PATHS.provider,
    serviceContextImports: serviceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    prismaAuthorizerUtilsStubRenderers:
      prismaAuthorizerUtilsStubRenderers.export(),
  },
  run({
    errorHandlerServiceImports,
    paths,
    serviceContextImports,
    typescriptFile,
  }) {
    return {
      providers: {
        prismaAuthorizerUtilsStubRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: PRISMA_AUTHORIZER_UTILS_STUB_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
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

export const PRISMA_AUTHORIZER_UTILS_STUB_RENDERERS = {
  provider: prismaAuthorizerUtilsStubRenderers,
  task: prismaAuthorizerUtilsStubRenderersTask,
};
