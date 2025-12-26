import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authRolesImportsProvider } from '#src/generators/auth/auth-roles/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { dataUtilsImportsProvider } from '#src/generators/prisma/data-utils/generated/ts-import-providers.js';

import { PRISMA_AUTHORIZER_UTILS_PATHS } from './template-paths.js';
import { PRISMA_AUTHORIZER_UTILS_TEMPLATES } from './typed-templates.js';

export interface PrismaAuthorizerUtilsRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof PRISMA_AUTHORIZER_UTILS_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const prismaAuthorizerUtilsRenderers =
  createProviderType<PrismaAuthorizerUtilsRenderers>(
    'prisma-authorizer-utils-renderers',
  );

const prismaAuthorizerUtilsRenderersTask = createGeneratorTask({
  dependencies: {
    authRolesImports: authRolesImportsProvider,
    dataUtilsImports: dataUtilsImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: PRISMA_AUTHORIZER_UTILS_PATHS.provider,
    serviceContextImports: serviceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    prismaAuthorizerUtilsRenderers: prismaAuthorizerUtilsRenderers.export(),
  },
  run({
    authRolesImports,
    dataUtilsImports,
    errorHandlerServiceImports,
    paths,
    serviceContextImports,
    typescriptFile,
  }) {
    return {
      providers: {
        prismaAuthorizerUtilsRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: PRISMA_AUTHORIZER_UTILS_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  authRolesImports,
                  dataUtilsImports,
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

export const PRISMA_AUTHORIZER_UTILS_RENDERERS = {
  provider: prismaAuthorizerUtilsRenderers,
  task: prismaAuthorizerUtilsRenderersTask,
};
