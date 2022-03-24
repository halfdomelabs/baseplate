import {
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactProvider } from '../react';
import { reactAppProvider } from '../react-app';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export interface ReactRouterProvider {
  addRoute(block: TypescriptCodeExpression): void;
  setMatchAllElement(component: TypescriptCodeExpression): void;
}

export const reactRouterProvider =
  createProviderType<ReactRouterProvider>('react-router');

const ReactRouterGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {
    node: nodeProvider,
    react: reactProvider,
    reactApp: reactAppProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactRouter: reactRouterProvider,
  },
  createGenerator(descriptor, { node, react, reactApp, typescript }) {
    node.addPackage('react-router-dom', '^6.2.2');
    node.addDevPackage('@types/react-router-dom', '^5.3.3');
    const routes: TypescriptCodeExpression[] = [];
    const config = createNonOverwriteableMap<{
      matchAllComponent?: TypescriptCodeExpression;
    }>({}, { name: 'react-router' });

    return {
      getProviders: () => ({
        reactRouter: {
          setMatchAllElement(matchAllComponent) {
            config.merge({ matchAllComponent });
          },
          addRoute(block) {
            routes.push(block);
          },
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(react.getSrcFolder());
        const renderedRoutes = [...routes];
        const { matchAllComponent } = config.value();

        if (matchAllComponent) {
          renderedRoutes.push(matchAllComponent);
        }

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

        pagesRootFile.addCodeExpression(
          'ROUTES',
          TypescriptCodeUtils.mergeExpressions(renderedRoutes)
        );

        await builder.apply(pagesRootFile.renderToAction('pages/index.tsx'));
      },
    };
  },
});

export default ReactRouterGenerator;
