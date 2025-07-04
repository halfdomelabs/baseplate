import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import type { ReactRoute, ReactRouteLayout } from '#src/providers/routes.js';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';
import {
  reactRoutesProvider,
  reactRoutesReadOnlyProvider,
} from '#src/providers/routes.js';

import { renderRoutes } from '../_utils/render-routes.js';
import { reactAppConfigProvider } from '../react-app/index.js';
import { CORE_REACT_ROUTER_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

const [setupTask, reactRouterConfigProvider, reactRouterConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      renderHeaders: t.map<string, TsCodeFragment>(),
      routesComponent: t.scalar<TsCodeFragment>(),
    }),
    {
      prefix: 'react-router',
      configScope: packageScope,
    },
  );

export { reactRouterConfigProvider };

const reactRouteValuesProvider = createReadOnlyProviderType<{
  routes: ReactRoute[];
  layouts: ReactRouteLayout[];
}>('react-route-values');

export const reactRouterGenerator = createGenerator({
  name: 'core/react-router',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, [
        '@tanstack/react-router',
        'react-router-dom',
      ]),
      dev: extractPackageVersions(REACT_PACKAGES, ['@tanstack/router-plugin']),
    }),
    paths: CORE_REACT_ROUTER_GENERATED.paths.task,
    reactAppConfig: createGeneratorTask({
      dependencies: {
        reactAppConfig: reactAppConfigProvider,
        paths: CORE_REACT_ROUTER_GENERATED.paths.provider,
      },
      run({ reactAppConfig, paths }) {
        reactAppConfig.renderWrappers.set('react-router', {
          wrap: (contents) =>
            TsCodeUtils.templateWithImports(
              tsImportBuilder(['BrowserRouter']).from('react-router-dom'),
            )`<BrowserRouter>${contents}</BrowserRouter>`,
          type: 'router',
        });

        reactAppConfig.renderRoot.set(
          tsCodeFragment(
            '<PagesRoot />',
            tsImportBuilder().default('PagesRoot').from(paths.index),
          ),
        );
      },
    }),
    routes: createGeneratorTask({
      exports: {
        reactRoutes: reactRoutesProvider.export(packageScope),
        reactRoutesReadOnly: reactRoutesReadOnlyProvider.export(packageScope),
      },
      outputs: {
        reactRouteValuesProvider: reactRouteValuesProvider.export(),
      },
      run() {
        const routes: ReactRoute[] = [];
        const layouts: ReactRouteLayout[] = [];

        return {
          providers: {
            reactRoutes: {
              registerRoute(route) {
                routes.push(route);
              },
              registerLayout(layout) {
                layouts.push(layout);
              },
              getDirectoryBase: () => `@/src/pages`,
              getRoutePrefix: () => ``,
            },
            reactRoutesReadOnly: {
              getDirectoryBase: () => `@/src/pages`,
              getRoutePrefix: () => ``,
            },
          },
          build: () => ({
            reactRouteValuesProvider: {
              routes,
              layouts,
            },
          }),
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        reactRouterConfigValues: reactRouterConfigValuesProvider,
        reactRouteValues: reactRouteValuesProvider,
        typescriptFile: typescriptFileProvider,
        paths: CORE_REACT_ROUTER_GENERATED.paths.provider,
      },
      run({
        reactRouterConfigValues: {
          routesComponent = tsCodeFragment(
            'Routes',
            tsImportBuilder(['Routes']).from('react-router-dom'),
          ),
          renderHeaders,
        },
        reactRouteValues: { routes, layouts },
        typescriptFile,
        paths,
      }) {
        return {
          build: async (builder) => {
            // TODO: Make sure we don't have more than one layout key

            // group routes by layout key
            const renderedRoutes = renderRoutes(routes, layouts);

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_GENERATED.templates.index,
                destination: paths.index,
                variables: {
                  TPL_RENDER_HEADER: TsCodeUtils.mergeFragments(renderHeaders),
                  TPL_ROUTES: TsCodeUtils.template`<${routesComponent}>${renderedRoutes}</${routesComponent}>`,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
