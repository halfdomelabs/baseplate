import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { VITEST_REACT_VITEST_PATHS } from './template-paths.js';
import { VITEST_REACT_VITEST_TEMPLATES } from './typed-templates.js';

export interface VitestReactVitestRenderers {
  setup: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof VITEST_REACT_VITEST_TEMPLATES.setup
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const vitestReactVitestRenderers =
  createProviderType<VitestReactVitestRenderers>(
    'vitest-react-vitest-renderers',
  );

const vitestReactVitestRenderersTask = createGeneratorTask({
  dependencies: {
    paths: VITEST_REACT_VITEST_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { vitestReactVitestRenderers: vitestReactVitestRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        vitestReactVitestRenderers: {
          setup: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: VITEST_REACT_VITEST_TEMPLATES.setup,
                destination: paths.setup,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const VITEST_REACT_VITEST_RENDERERS = {
  provider: vitestReactVitestRenderers,
  task: vitestReactVitestRenderersTask,
};
