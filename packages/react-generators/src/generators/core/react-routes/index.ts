import {
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import {
  ReactRoute,
  ReactRouteLayout,
  reactRoutesProvider,
  reactRoutesReadOnlyProvider,
} from '@src/providers/routes';
import { notEmpty } from '@src/utils/array';
import { dasherizeCamel, upperCaseFirst } from '@src/utils/case';
import { renderRoutes } from '../_shared/routes/renderRoutes';
import { reactNotFoundProvider } from '../react-not-found-handler';

const descriptorSchema = z.object({
  name: z.string().min(1),
  layoutKey: z.string().optional(),
  // whether to pass the routes through to the parent routes container
  isPassthrough: z.boolean().optional(),
});

const ReactRoutesGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactRoutes: reactRoutesProvider.dependency().modifiedInBuild(),
    typescript: typescriptProvider,
    reactNotFound: reactNotFoundProvider.dependency().optional(),
  },
  exports: {
    reactRoutes: reactRoutesProvider,
    reactRoutesReadOnly: reactRoutesReadOnlyProvider,
  },
  createGenerator(
    { name, layoutKey, isPassthrough },
    { reactRoutes, typescript, reactNotFound }
  ) {
    const routes: ReactRoute[] = [];
    const layouts: ReactRouteLayout[] = [];

    const pathName = dasherizeCamel(name);

    const directoryBase = `${reactRoutes.getDirectoryBase()}/${pathName}`;

    return {
      getProviders: () => ({
        reactRoutes: {
          registerRoute(route) {
            routes.push(route);
          },
          registerLayout(layout) {
            layouts.push(layout);
          },
          getDirectoryBase: () => directoryBase,
          getRoutePrefix: () => `${reactRoutes.getRoutePrefix()}/${pathName}`,
        },
        reactRoutesReadOnly: {
          getDirectoryBase: () => directoryBase,
          getRoutePrefix: () => `${reactRoutes.getRoutePrefix()}/${pathName}`,
        },
      }),
      build: async (builder) => {
        if (isPassthrough) {
          const renderedRoutes = renderRoutes(routes, layouts);

          reactRoutes.registerRoute({
            path: pathName,
            layoutKey,
            children: renderedRoutes,
          });
          routes.forEach((route) =>
            reactRoutes.registerRoute({
              ...route,
              path:
                route.path &&
                `${reactRoutes.getRoutePrefix()}/${pathName}/${route.path}`,
            })
          );
          layouts.forEach((layout) => reactRoutes.registerLayout(layout));
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
            ROUTES_NAME: componentName,
            ROUTES: renderedRoutes,
          });

          reactRoutes.registerRoute({
            path: `${pathName}/*`,
            layoutKey,
            element: TypescriptCodeUtils.createExpression(
              `<${componentName} />`,
              `import ${componentName} from "@/${directoryBase}"`
            ),
          });

          await builder.apply(
            pagesRootFile.renderToAction(
              'index.tsx',
              `${directoryBase}/index.tsx`
            )
          );
        }
      },
    };
  },
});

export default ReactRoutesGenerator;
