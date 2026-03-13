import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { POTHOS_POTHOS_SENTRY_PATHS } from './template-paths.js';
import { POTHOS_POTHOS_SENTRY_TEMPLATES } from './typed-templates.js';

export interface PothosPothosSentryRenderers {
  useSentry: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof POTHOS_POTHOS_SENTRY_TEMPLATES.useSentry
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const pothosPothosSentryRenderers =
  createProviderType<PothosPothosSentryRenderers>(
    'pothos-pothos-sentry-renderers',
  );

const pothosPothosSentryRenderersTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_SENTRY_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    pothosPothosSentryRenderers: pothosPothosSentryRenderers.export(),
  },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        pothosPothosSentryRenderers: {
          useSentry: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_SENTRY_TEMPLATES.useSentry,
                destination: paths.useSentry,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const POTHOS_POTHOS_SENTRY_RENDERERS = {
  provider: pothosPothosSentryRenderers,
  task: pothosPothosSentryRenderersTask,
};
