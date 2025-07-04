import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';

import { CORE_FASTIFY_SENTRY_PATHS } from './template-paths.js';
import { CORE_FASTIFY_SENTRY_TEMPLATES } from './typed-templates.js';

export interface CoreFastifySentryRenderers {
  instrument: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_FASTIFY_SENTRY_TEMPLATES.instrument
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  sentry: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_FASTIFY_SENTRY_TEMPLATES.sentry
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreFastifySentryRenderers =
  createProviderType<CoreFastifySentryRenderers>(
    'core-fastify-sentry-renderers',
  );

const coreFastifySentryRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: CORE_FASTIFY_SENTRY_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreFastifySentryRenderers: coreFastifySentryRenderers.export() },
  run({
    configServiceImports,
    errorHandlerServiceImports,
    paths,
    typescriptFile,
  }) {
    return {
      providers: {
        coreFastifySentryRenderers: {
          instrument: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_SENTRY_TEMPLATES.instrument,
                destination: paths.instrument,
                importMapProviders: {
                  configServiceImports,
                },
                ...options,
              }),
          },
          sentry: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_SENTRY_TEMPLATES.sentry,
                destination: paths.sentry,
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_FASTIFY_SENTRY_RENDERERS = {
  provider: coreFastifySentryRenderers,
  task: coreFastifySentryRenderersTask,
};
