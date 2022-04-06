import {
  nodeProvider,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import {
  ReactPagesLayout,
  reactPagesProvider,
  ReactPagesRoute,
} from '@src/providers/pages';
import { notEmpty } from '@src/utils/array';
import { renderRoutes } from '../_shared/routes/renderRoutes';
import { reactProvider } from '../react';
import { reactAppProvider } from '../react-app';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

const ReactRouterGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {
    node: nodeProvider,
    react: reactProvider,
    reactApp: reactAppProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactPages: reactPagesProvider,
  },
  createGenerator(descriptor, { node, react, reactApp, typescript }) {
    node.addPackage('react-router-dom', '^6.2.2');
    node.addDevPackage('@types/react-router-dom', '^5.3.3');
    const routes: ReactPagesRoute[] = [];
    const layouts: ReactPagesLayout[] = [];

    return {
      getProviders: () => ({
        reactPages: {
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
          .getAppFile()
          .addCodeWrapper(
            'RENDER_WRAPPERS',
            new TypescriptCodeWrapper(
              (contents) => `<BrowserRouter>${contents}</BrowserRouter>`,
              "import {BrowserRouter} from 'react-router-dom'"
            )
          )
          .addCodeExpression(
            'RENDER_ROOT',
            TypescriptCodeUtils.createExpression(
              '<PagesRoot />',
              `import PagesRoot from "@/${react.getSrcFolder()}/pages"`
            )
          );

        const pagesRootFile = typescript.createTemplate({
          ROUTE_HEADER: { type: 'code-block' },
          ROUTES: { type: 'code-expression' },
        });

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
