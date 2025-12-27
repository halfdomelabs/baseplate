import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authorizerUtilsImportsProvider } from '#src/generators/auth/_providers/authorizer-utils-imports.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';

import { POTHOS_POTHOS_AUTH_PATHS } from './template-paths.js';
import { POTHOS_POTHOS_AUTH_TEMPLATES } from './typed-templates.js';

export interface PothosPothosAuthRenderers {
  fieldAuthorizePluginGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof POTHOS_POTHOS_AUTH_TEMPLATES.fieldAuthorizePluginGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const pothosPothosAuthRenderers = createProviderType<PothosPothosAuthRenderers>(
  'pothos-pothos-auth-renderers',
);

const pothosPothosAuthRenderersTask = createGeneratorTask({
  dependencies: {
    authorizerUtilsImports: authorizerUtilsImportsProvider,
    paths: POTHOS_POTHOS_AUTH_PATHS.provider,
    serviceContextImports: serviceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { pothosPothosAuthRenderers: pothosPothosAuthRenderers.export() },
  run({
    authorizerUtilsImports,
    paths,
    serviceContextImports,
    typescriptFile,
  }) {
    return {
      providers: {
        pothosPothosAuthRenderers: {
          fieldAuthorizePluginGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: POTHOS_POTHOS_AUTH_TEMPLATES.fieldAuthorizePluginGroup,
                paths,
                importMapProviders: {
                  authorizerUtilsImports,
                  serviceContextImports,
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

export const POTHOS_POTHOS_AUTH_RENDERERS = {
  provider: pothosPothosAuthRenderers,
  task: pothosPothosAuthRenderersTask,
};
