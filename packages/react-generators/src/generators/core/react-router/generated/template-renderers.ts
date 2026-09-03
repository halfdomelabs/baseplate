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
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  placeholderIndex: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTER_TEMPLATES.placeholderIndex
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  rootRoute: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTER_TEMPLATES.rootRoute
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  routeErrorComponent: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTER_TEMPLATES.routeErrorComponent
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  router: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTER_TEMPLATES.router
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  routeTree: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTER_TEMPLATES.routeTree
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
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
                ...options,
              }),
          },
          placeholderIndex: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_TEMPLATES.placeholderIndex,
                destination: paths.placeholderIndex,
                ...options,
              }),
          },
          rootRoute: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_TEMPLATES.rootRoute,
                destination: paths.rootRoute,
                ...options,
              }),
          },
          routeErrorComponent: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_TEMPLATES.routeErrorComponent,
                destination: paths.routeErrorComponent,
                importMapProviders: {
                  reactComponentsImports,
                },
                ...options,
              }),
          },
          router: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_TEMPLATES.router,
                destination: paths.router,
                importMapProviders: {
                  reactComponentsImports,
                },
                generatorPaths: paths,
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
