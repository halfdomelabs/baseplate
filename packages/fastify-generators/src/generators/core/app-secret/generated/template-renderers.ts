import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

import { CORE_APP_SECRET_PATHS } from './template-paths.js';
import { CORE_APP_SECRET_TEMPLATES } from './typed-templates.js';

export interface CoreAppSecretRenderers {
  appSecret: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_APP_SECRET_TEMPLATES.appSecret
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreAppSecretRenderers = createProviderType<CoreAppSecretRenderers>(
  'core-app-secret-renderers',
);

const coreAppSecretRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    paths: CORE_APP_SECRET_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreAppSecretRenderers: coreAppSecretRenderers.export() },
  run({ configServiceImports, paths, typescriptFile }) {
    return {
      providers: {
        coreAppSecretRenderers: {
          appSecret: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_APP_SECRET_TEMPLATES.appSecret,
                destination: paths.appSecret,
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

export const CORE_APP_SECRET_RENDERERS = {
  provider: coreAppSecretRenderers,
  task: coreAppSecretRenderersTask,
};
