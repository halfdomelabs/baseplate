import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  TsCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import type { ReactRoute, ReactRouteLayout } from '@src/providers/routes.js';

import {
  reactRoutesProvider,
  reactRoutesReadOnlyProvider,
} from '@src/providers/routes.js';
import { dasherizeCamel, upperCaseFirst } from '@src/utils/case.js';
import { createRouteElement } from '@src/utils/routes.js';

import { renderRoutes } from '../_utils/render-routes.js';
import { reactNotFoundProvider } from '../react-not-found-handler/react-not-found-handler.generator.js';
import { CORE_REACT_ROUTES_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  id: z.string().min(1),
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
  buildTasks: ({ id, name, layoutKey, isPassthrough }) => ({
    main: createGeneratorTask({
      dependencies: {
        reactRoutes: reactRoutesProvider.dependency().parentScopeOnly(),
        typescriptFile: typescriptFileProvider,
        reactNotFound: reactNotFoundProvider.dependency().optional(),
      },
      exports: {
        reactRoutes: reactRoutesProvider.export(),
        reactRoutesReadOnly: reactRoutesReadOnlyProvider.export(),
      },
      run({ reactRoutes, typescriptFile, reactNotFound }) {
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

              await builder.apply(
                typescriptFile.renderTemplateFile({
                  id: `route-${id}`,
                  template: CORE_REACT_ROUTES_TS_TEMPLATES.index,
                  destination: `${directoryBase}/index.tsx`,
                  includeMetadataOnDemand: true,
                  variables: {
                    TPL_ROUTE_HEADER: TsCodeUtils.mergeFragments(
                      new Map(
                        layouts.map(
                          (layout) =>
                            [layout.key, layout.header] as [
                              string,
                              TsCodeFragment | undefined,
                            ],
                        ),
                      ),
                    ),
                    TPL_ROUTES: renderedRoutes,
                    TPL_ROUTES_NAME: `${upperCaseFirst(name)}FeatureRoutes`,
                  },
                }),
              );

              reactRoutes.registerRoute({
                path: `${pathName}/*`,
                layoutKey,
                element: createRouteElement(componentName, directoryBase),
              });
            }
          },
        };
      },
    }),
  }),
});
