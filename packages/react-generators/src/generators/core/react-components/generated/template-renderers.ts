import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_COMPONENTS_PATHS } from './template-paths.js';
import { CORE_REACT_COMPONENTS_TEMPLATES } from './typed-templates.js';

export interface CoreReactComponentsRenderers {
  componentsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof CORE_REACT_COMPONENTS_TEMPLATES.componentsGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  hooksGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof CORE_REACT_COMPONENTS_TEMPLATES.hooksGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  stylesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof CORE_REACT_COMPONENTS_TEMPLATES.stylesGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  utilsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof CORE_REACT_COMPONENTS_TEMPLATES.utilsGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
}

const coreReactComponentsRenderers =
  createProviderType<CoreReactComponentsRenderers>(
    'core-react-components-renderers',
  );

const coreReactComponentsRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_COMPONENTS_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreReactComponentsRenderers: coreReactComponentsRenderers.export(),
  },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreReactComponentsRenderers: {
          componentsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: CORE_REACT_COMPONENTS_TEMPLATES.componentsGroup,
                paths,
                ...options,
              }),
          },
          hooksGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: CORE_REACT_COMPONENTS_TEMPLATES.hooksGroup,
                paths,
                ...options,
              }),
          },
          stylesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: CORE_REACT_COMPONENTS_TEMPLATES.stylesGroup,
                paths,
                ...options,
              }),
          },
          utilsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: CORE_REACT_COMPONENTS_TEMPLATES.utilsGroup,
                paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_COMPONENTS_RENDERERS = {
  provider: coreReactComponentsRenderers,
  task: coreReactComponentsRenderersTask,
};
