import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  reactConfigImportsProvider,
  reactRouterImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_SENTRY_PATHS } from './template-paths.js';
import { CORE_REACT_SENTRY_TEMPLATES } from './typed-templates.js';

export interface CoreReactSentryRenderers {
  sentry: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_SENTRY_TEMPLATES.sentry
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreReactSentryRenderers = createProviderType<CoreReactSentryRenderers>(
  'core-react-sentry-renderers',
);

const coreReactSentryRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_SENTRY_PATHS.provider,
    reactConfigImports: reactConfigImportsProvider,
    reactRouterImports: reactRouterImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactSentryRenderers: coreReactSentryRenderers.export() },
  run({ paths, reactConfigImports, reactRouterImports, typescriptFile }) {
    return {
      providers: {
        coreReactSentryRenderers: {
          sentry: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_SENTRY_TEMPLATES.sentry,
                destination: paths.sentry,
                importMapProviders: {
                  reactConfigImports,
                  reactRouterImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_SENTRY_RENDERERS = {
  provider: coreReactSentryRenderers,
  task: coreReactSentryRenderersTask,
};
