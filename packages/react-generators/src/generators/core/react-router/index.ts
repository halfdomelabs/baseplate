import {
  nodeProvider,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import {
  ReactRouteLayout,
  reactRoutesProvider,
  ReactRoute,
  reactRoutesReadOnlyProvider,
} from '@src/providers/routes';
import { notEmpty } from '@src/utils/array';
import { renderRoutes } from '../_shared/routes/renderRoutes';
import { reactProvider } from '../react';
import { reactAppProvider } from '../react-app';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface ReactRouterProvider {
  addRouteHeader(block: TypescriptCodeBlock): void;
}

export const reactRouterProvider =
  createProviderType<ReactRouterProvider>('react-router');

const ReactRouterGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    routes: {
      isMultiple: true,
    },
    notFoundHandler: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-not-found-handler',
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
    reactRoutesReadOnly: reactRoutesReadOnlyProvider,
    reactRouter: reactRouterProvider,
  },
  createGenerator(descriptor, { node, react, reactApp, typescript }) {
    node.addPackage('react-router-dom', '6.8.1');

    const routes: ReactRoute[] = [];
    const layouts: ReactRouteLayout[] = [];
    const headerBlocks: TypescriptCodeBlock[] = [];

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
        reactRoutesReadOnly: {
          getDirectoryBase: () => `${react.getSrcFolder()}/pages`,
          getRoutePrefix: () => ``,
        },
        reactRouter: {
          addRouteHeader(block) {
            headerBlocks.push(block);
          },
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
          ROUTE_HEADER: [
            ...headerBlocks,
            ...layouts.map((layout) => layout.header).filter(notEmpty),
          ],
          ROUTES: renderedRoutes,
        });

        await builder.apply(pagesRootFile.renderToAction('pages/index.tsx'));
      },
    };
  },
});

export default ReactRouterGenerator;
