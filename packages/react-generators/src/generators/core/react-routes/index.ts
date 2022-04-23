import {
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import {
  ReactRoute,
  ReactRouteLayout,
  reactRoutesProvider,
} from '@src/providers/routes';
import { notEmpty } from '@src/utils/array';
import { upperCaseFirst } from '@src/utils/case';
import { renderRoutes } from '../_shared/routes/renderRoutes';
import { reactNotFoundProvider } from '../react-not-found-handler';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  layoutKey: yup.string(),
  // whether to pass the routes through to the parent routes container
  isPassthrough: yup.boolean(),
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
  },
  createGenerator(
    { name, layoutKey, isPassthrough },
    { reactRoutes, typescript, reactNotFound }
  ) {
    const routes: ReactRoute[] = [];
    const layouts: ReactRouteLayout[] = [];

    const directoryBase = `${reactRoutes.getDirectoryBase()}/${name}`;

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
          getRoutePrefix: () => `${reactRoutes.getRoutePrefix()}/${name}`,
        },
      }),
      build: async (builder) => {
        if (isPassthrough) {
          const renderedRoutes = renderRoutes(routes, layouts);

          reactRoutes.registerRoute({
            path: name,
            layoutKey,
            children: renderedRoutes,
          });
          routes.forEach((route) =>
            reactRoutes.registerRoute({
              ...route,
              path:
                route.path &&
                `${reactRoutes.getRoutePrefix()}/${name}/${route.path}`,
            })
          );
          layouts.forEach((layout) => reactRoutes.registerLayout(layout));
        } else {
          // if we have an optional notFoundHandler, we need to register it as a route
          if (reactNotFound) {
            routes.push(reactNotFound.getNotFoundRoute());
          }

          const renderedRoutes = renderRoutes(routes, layouts);

          const routesName = `${upperCaseFirst(name)}Routes`;

          const pagesRootFile = typescript.createTemplate({
            ROUTE_HEADER: { type: 'code-block' },
            ROUTES_NAME: { type: 'code-expression' },
            ROUTES: { type: 'code-expression' },
          });

          pagesRootFile.addCodeEntries({
            ROUTE_HEADER: layouts
              .map((layout) => layout.header)
              .filter(notEmpty),
            ROUTES_NAME: routesName,
            ROUTES: renderedRoutes,
          });

          reactRoutes.registerRoute({
            path: `${name}/*`,
            layoutKey,
            element: TypescriptCodeUtils.createExpression(
              `<${routesName} />`,
              `import ${routesName} from "@/${directoryBase}"`
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
