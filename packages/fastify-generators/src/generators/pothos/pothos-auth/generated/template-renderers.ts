import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';

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
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: POTHOS_POTHOS_AUTH_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { pothosPothosAuthRenderers: pothosPothosAuthRenderers.export() },
  run({ errorHandlerServiceImports, paths, typescriptFile }) {
    return {
      providers: {
        pothosPothosAuthRenderers: {
          fieldAuthorizePluginGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: POTHOS_POTHOS_AUTH_TEMPLATES.fieldAuthorizePluginGroup,
                paths,
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

export const POTHOS_POTHOS_AUTH_RENDERERS = {
  provider: pothosPothosAuthRenderers,
  task: pothosPothosAuthRenderersTask,
};
