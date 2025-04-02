import {
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import type { ReactRoute, ReactRouteLayout } from '@src/providers/routes.js';

import {
  reactRoutesProvider,
  reactRoutesReadOnlyProvider,
} from '@src/providers/routes.js';
import { notEmpty } from '@src/utils/array.js';
import { dasherizeCamel, upperCaseFirst } from '@src/utils/case.js';

import { renderRoutes } from '../_utils/render-routes.js';
import { reactNotFoundProvider } from '../react-not-found-handler/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  layoutKey: z.string().optional(),
  // whether to pass the routes through to the parent routes container
  isPassthrough: z.boolean().optional(),
});

export const reactRoutesGenerator = createGenerator({
  name: 'core/react-routes',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: ({ name, layoutKey, isPassthrough }) => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        reactRoutes: reactRoutesProvider.dependency().parentScopeOnly(),
        typescript: typescriptProvider,
        reactNotFound: reactNotFoundProvider.dependency().optional(),
      },
      exports: {
        reactRoutes: reactRoutesProvider.export(),
        reactRoutesReadOnly: reactRoutesReadOnlyProvider.export(),
      },
      run({ reactRoutes, typescript, reactNotFound }) {
        const routes: ReactRoute[] = [];
        const layouts: ReactRouteLayout[] = [];

        const pathName = dasherizeCamel(name);

        const directoryBase = `${reactRoutes.getDirectoryBase()}/${pathName}`;

        return {
          providers: {
            reactRoutes: {
              registerRoute(route) {
                routes.push(route);
              },
              registerLayout(layout) {
                layouts.push(layout);
              },
              getDirectoryBase: () => directoryBase,
              getRoutePrefix: () =>
                `${reactRoutes.getRoutePrefix()}/${pathName}`,
            },
            reactRoutesReadOnly: {
              getDirectoryBase: () => directoryBase,
              getRoutePrefix: () =>
                `${reactRoutes.getRoutePrefix()}/${pathName}`,
            },
          },
          build: async (builder) => {
            if (isPassthrough) {
              const renderedRoutes = renderRoutes(routes, layouts);

              reactRoutes.registerRoute({
                path: pathName,
                layoutKey,
                children: renderedRoutes,
              });
              for (const route of routes)
                reactRoutes.registerRoute({
                  ...route,
                  path:
                    route.path &&
                    `${reactRoutes.getRoutePrefix()}/${pathName}/${route.path}`,
                });
              for (const layout of layouts) reactRoutes.registerLayout(layout);
            } else {
              // if we have an optional notFoundHandler, we need to register it as a route
              if (reactNotFound) {
                routes.push(reactNotFound.getNotFoundRoute());
              }

              const renderedRoutes = renderRoutes(routes, layouts);

              const componentName = `${upperCaseFirst(name)}Routes`;

              const pagesRootFile = typescript.createTemplate({
                ROUTE_HEADER: { type: 'code-block' },
                ROUTES_NAME: { type: 'code-expression' },
                ROUTES: { type: 'code-expression' },
              });

              pagesRootFile.addCodeEntries({
                ROUTE_HEADER: layouts
                  .map((layout) => layout.header)
                  .filter(notEmpty),
                ROUTES_NAME: `${upperCaseFirst(name)}FeatureRoutes`,
                ROUTES: renderedRoutes,
              });

              reactRoutes.registerRoute({
                path: `${pathName}/*`,
                layoutKey,
                element: TypescriptCodeUtils.createExpression(
                  `<${componentName} />`,
                  `import ${componentName} from "@/${directoryBase}"`,
                ),
              });

              await builder.apply(
                pagesRootFile.renderToAction(
                  'index.tsx',
                  `${directoryBase}/index.tsx`,
                ),
              );
            }
          },
        };
      },
    }),
  ],
});
