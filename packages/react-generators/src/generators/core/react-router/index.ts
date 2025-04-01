import type {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import type { ReactRoute, ReactRouteLayout } from '@src/providers/routes.js';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';
import {
  reactRoutesProvider,
  reactRoutesReadOnlyProvider,
} from '@src/providers/routes.js';
import { notEmpty } from '@src/utils/array.js';

import { renderRoutes } from '../_utils/render-routes.js';
import { reactAppProvider } from '../react-app/index.js';
import { reactProvider } from '../react/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface ReactRouterProvider {
  addRouteHeader(block: TypescriptCodeBlock): void;
  setRoutesComponent(component: TypescriptCodeExpression): void;
}

export const reactRouterProvider =
  createProviderType<ReactRouterProvider>('react-router');

export const reactRouterGenerator = createGenerator({
  name: 'core/react-router',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        react: reactProvider,
        reactApp: reactAppProvider,
        typescript: typescriptProvider,
      },
      exports: {
        reactRoutes: reactRoutesProvider.export(projectScope),
        reactRoutesReadOnly: reactRoutesReadOnlyProvider.export(projectScope),
        reactRouter: reactRouterProvider.export(projectScope),
      },
      run({ node, react, reactApp, typescript }) {
        node.addPackages({
          'react-router-dom': REACT_PACKAGES['react-router-dom'],
        });

        const routes: ReactRoute[] = [];
        const layouts: ReactRouteLayout[] = [];
        const headerBlocks: TypescriptCodeBlock[] = [];

        let routesComponent: TypescriptCodeExpression | undefined;

        return {
          providers: {
            reactRoutes: {
              registerRoute(route) {
                routes.push(route);
              },
              registerLayout(layout) {
                layouts.push(layout);
              },
              getDirectoryBase: () => `${react.getSrcFolder()}/pages`,
              getRoutePrefix: () => ``,
            },
            reactRoutesReadOnly: {
              getDirectoryBase: () => `${react.getSrcFolder()}/pages`,
              getRoutePrefix: () => ``,
            },
            reactRouter: {
              addRouteHeader(block) {
                headerBlocks.push(block);
              },
              setRoutesComponent(component) {
                if (routesComponent) {
                  throw new Error('Routes component already set');
                }
                routesComponent = component;
              },
            },
          },
          build: async (builder) => {
            routesComponent =
              routesComponent ??
              TypescriptCodeUtils.createExpression(
                'Routes',
                `import { Routes } from 'react-router-dom'`,
              );

            const [pagesImport, pagesPath] = makeImportAndFilePath(
              path.join(react.getSrcFolder(), 'pages/index.tsx'),
            );

            reactApp
              .getRenderWrappers()
              .addItem(
                'react-router',
                new TypescriptCodeWrapper(
                  (contents) => `<BrowserRouter>${contents}</BrowserRouter>`,
                  "import {BrowserRouter} from 'react-router-dom'",
                ),
              );

            reactApp.setRenderRoot(
              TypescriptCodeUtils.createExpression(
                '<PagesRoot />',
                `import PagesRoot from "${pagesImport}"`,
              ),
            );

            const pagesRootFile = typescript.createTemplate({
              ROUTE_HEADER: { type: 'code-block' },
              ROUTES: { type: 'code-expression' },
              ROUTES_COMPONENT: { type: 'code-expression' },
            });

            // TODO: Make sure we don't have more than one layout key

            // group routes by layout key
            const renderedRoutes = renderRoutes(routes, layouts);

            pagesRootFile.addCodeEntries({
              ROUTE_HEADER: [
                ...headerBlocks,
                ...layouts.map((layout) => layout.header).filter(notEmpty),
              ],
              ROUTES: renderedRoutes,
              ROUTES_COMPONENT: routesComponent,
            });

            await builder.apply(
              pagesRootFile.renderToAction('pages/index.tsx', pagesPath),
            );
          },
        };
      },
    }),
  ],
});
