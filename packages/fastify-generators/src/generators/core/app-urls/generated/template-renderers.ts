import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

import { CORE_APP_URLS_PATHS } from './template-paths.js';
import { CORE_APP_URLS_TEMPLATES } from './typed-templates.js';

export interface CoreAppUrlsRenderers {
  appUrls: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof CORE_APP_URLS_TEMPLATES.appUrls>,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreAppUrlsRenderers = createProviderType<CoreAppUrlsRenderers>(
  'core-app-urls-renderers',
);

const coreAppUrlsRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    paths: CORE_APP_URLS_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreAppUrlsRenderers: coreAppUrlsRenderers.export() },
  run({ configServiceImports, paths, typescriptFile }) {
    return {
      providers: {
        coreAppUrlsRenderers: {
          appUrls: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_APP_URLS_TEMPLATES.appUrls,
                destination: paths.appUrls,
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

export const CORE_APP_URLS_RENDERERS = {
  provider: coreAppUrlsRenderers,
  task: coreAppUrlsRenderersTask,
};
