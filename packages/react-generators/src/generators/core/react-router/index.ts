import {
  nodeProvider,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import {
  ReactRouteLayout,
  reactRoutesProvider,
  ReactRoute,
} from '@src/providers/routes';
import { notEmpty } from '@src/utils/array';
import { renderRoutes } from '../_shared/routes/renderRoutes';
import { reactProvider } from '../react';
import { reactAppProvider } from '../react-app';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

const ReactRouterGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    routes: {
      isMultiple: true,
    },
    notFoundHandler: {
      defaultDescriptor: {
        generator: '@baseplate/react/core/react-not-found-handler',
        peerProvider: true,
      },
    },
  }),
  dependencies: {
    node: nodeProvider,
    react: reactProvider,
    reactApp: reactAppProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactRoutes: reactRoutesProvider,
  },
  createGenerator(descriptor, { node, react, reactApp, typescript }) {
    node.addPackage('react-router-dom', '^6.2.2');
    node.addDevPackage('@types/react-router-dom', '^5.3.3');

    // add forced resolution due to bug where @types/react are resolving to ^18
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/59809
    // TODO: Fix and remove when we upgrade React to 18
    node.mergeExtraProperties({
      resolutions: {
        '@types/react': '^17.0.20',
      },
    });

    const routes: ReactRoute[] = [];
    const layouts: ReactRouteLayout[] = [];

    return {
      getProviders: () => ({
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
      }),
      build: async (builder) => {
        builder.setBaseDirectory(react.getSrcFolder());

        reactApp
          .getRenderWrappers()
          .addItem(
            'react-router',
            new TypescriptCodeWrapper(
              (contents) => `<BrowserRouter>${contents}</BrowserRouter>`,
              "import {BrowserRouter} from 'react-router-dom'"
            )
          );

        reactApp.setRenderRoot(
          TypescriptCodeUtils.createExpression(
            '<PagesRoot />',
            `import PagesRoot from "@/${react.getSrcFolder()}/pages"`
          )
        );

        const pagesRootFile = typescript.createTemplate({
          ROUTE_HEADER: { type: 'code-block' },
          ROUTES: { type: 'code-expression' },
        });

        // TODO: Make sure we don't have more than one layout key

        // group routes by layout key
        const renderedRoutes = renderRoutes(routes, layouts);

        pagesRootFile.addCodeEntries({
          ROUTE_HEADER: layouts.map((layout) => layout.header).filter(notEmpty),
          ROUTES: renderedRoutes,
        });

        await builder.apply(pagesRootFile.renderToAction('pages/index.tsx'));
      },
    };
  },
});

export default ReactRouterGenerator;
