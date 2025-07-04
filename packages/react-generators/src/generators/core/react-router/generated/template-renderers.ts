import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

import { CORE_REACT_ROUTER_PATHS } from './template-paths.js';
import { CORE_REACT_ROUTER_TEMPLATES } from './typed-templates.js';

export interface CoreReactRouterRenderers {
  appRoutes: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTER_TEMPLATES.appRoutes
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  index: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTER_TEMPLATES.index
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  routeTree: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTER_TEMPLATES.routeTree
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactRouterRenderers = createProviderType<CoreReactRouterRenderers>(
  'core-react-router-renderers',
);

const coreReactRouterRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_ROUTER_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactRouterRenderers: coreReactRouterRenderers.export() },
  run({ paths, reactComponentsImports, typescriptFile }) {
    return {
      providers: {
        coreReactRouterRenderers: {
          appRoutes: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_TEMPLATES.appRoutes,
                destination: paths.appRoutes,
                importMapProviders: {
                  reactComponentsImports,
                },
                ...options,
              }),
          },
          index: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_TEMPLATES.index,
                destination: paths.index,
                ...options,
              }),
          },
          routeTree: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_TEMPLATES.routeTree,
                destination: paths.routeTree,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_ROUTER_RENDERERS = {
  provider: coreReactRouterRenderers,
  task: coreReactRouterRenderersTask,
};
