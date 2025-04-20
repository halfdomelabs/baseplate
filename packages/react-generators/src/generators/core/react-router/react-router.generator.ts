import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import type { ReactRoute, ReactRouteLayout } from '@src/providers/routes.js';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';
import {
  reactRoutesProvider,
  reactRoutesReadOnlyProvider,
} from '@src/providers/routes.js';

import { renderRoutes } from '../_utils/render-routes.js';
import { reactAppConfigProvider } from '../react-app/react-app.generator.js';
import { CORE_REACT_ROUTER_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const [setupTask, reactRouterConfigProvider, reactRouterConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      renderHeaders: t.map<string, TsCodeFragment>(),
      routesComponent: t.scalar<TsCodeFragment>(),
    }),
    {
      prefix: 'react-router',
      configScope: projectScope,
    },
  );

export { reactRouterConfigProvider };

const pagesPath = '@/src/pages/index.tsx';

export const reactRouterGenerator = createGenerator({
  name: 'core/react-router',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['react-router-dom']),
    }),
    reactAppConfig: createProviderTask(
      reactAppConfigProvider,
      (reactAppConfig) => {
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
            tsImportBuilder().default('PagesRoot').from(pagesPath),
          ),
        );
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        reactRouterConfigValues: reactRouterConfigValuesProvider,
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        reactRoutes: reactRoutesProvider.export(projectScope),
        reactRoutesReadOnly: reactRoutesReadOnlyProvider.export(projectScope),
      },
      run({
        reactRouterConfigValues: {
          routesComponent = tsCodeFragment(
            'Routes',
            tsImportBuilder(['Routes']).from('react-router-dom'),
          ),
          renderHeaders,
        },
        typescriptFile,
      }) {
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
              getDirectoryBase: () => `src/pages`,
              getRoutePrefix: () => ``,
            },
            reactRoutesReadOnly: {
              getDirectoryBase: () => `src/pages`,
              getRoutePrefix: () => ``,
            },
          },
          build: async (builder) => {
            // TODO: Make sure we don't have more than one layout key

            // group routes by layout key
            const renderedRoutes = renderRoutes(routes, layouts);

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_TS_TEMPLATES.index,
                destination: 'src/pages/index.tsx',
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
