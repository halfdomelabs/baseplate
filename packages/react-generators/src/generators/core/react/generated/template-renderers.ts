import type {
  RenderRawTemplateFileActionInput,
  RenderTextTemplateGroupActionInput,
  RenderTsTemplateFileActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import {
  renderRawTemplateFileAction,
  renderTextTemplateGroupAction,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_PATHS } from './template-paths.js';
import { CORE_REACT_TEMPLATES } from './typed-templates.js';

export interface CoreReactRenderers {
  favicon: {
    render: (
      options: Omit<
        RenderRawTemplateFileActionInput<typeof CORE_REACT_TEMPLATES.favicon>,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
  main: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof CORE_REACT_TEMPLATES.main>,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  staticGroup: {
    render: (
      options: Omit<
        RenderTextTemplateGroupActionInput<
          typeof CORE_REACT_TEMPLATES.staticGroup
        >,
        'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  viteConfig: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof CORE_REACT_TEMPLATES.viteConfig>,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreReactRenderers = createProviderType<CoreReactRenderers>(
  'core-react-renderers',
);

const coreReactRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactRenderers: coreReactRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreReactRenderers: {
          favicon: {
            render: (options) =>
              renderRawTemplateFileAction({
                template: CORE_REACT_TEMPLATES.favicon,
                destination: paths.favicon,
                ...options,
              }),
          },
          main: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_TEMPLATES.main,
                destination: paths.main,
                ...options,
              }),
          },
          staticGroup: {
            render: (options) =>
              renderTextTemplateGroupAction({
                group: CORE_REACT_TEMPLATES.staticGroup,
                paths,
                ...options,
              }),
          },
          viteConfig: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_TEMPLATES.viteConfig,
                destination: paths.viteConfig,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_RENDERERS = {
  provider: coreReactRenderers,
  task: coreReactRenderersTask,
};
