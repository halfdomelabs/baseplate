import {
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactAppProvider } from '../react-app';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

export interface ReactRouterProvider {
  setMatchAllElement(component: TypescriptCodeExpression): void;
  setIndexElement(component: TypescriptCodeExpression): void;
  addRoute(block: TypescriptCodeExpression): void;
}

export const reactRouterProvider =
  createProviderType<ReactRouterProvider>('react-router');

const ReactRouterGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {
    node: nodeProvider,
    reactApp: reactAppProvider,
  },
  exports: {
    reactRouter: reactRouterProvider,
  },
  createGenerator(descriptor, { node, reactApp }) {
    node.addPackage('react-router-dom', '^6.2.2');
    node.addDevPackage('@types/react-router-dom', '^5.3.3');
    const routes: TypescriptCodeExpression[] = [];
    const config = createNonOverwriteableMap<{
      matchAllComponent?: TypescriptCodeExpression;
      indexComponent?: TypescriptCodeExpression;
    }>({}, { name: 'react-router' });
    return {
      getProviders: () => ({
        reactRouter: {
          setMatchAllElement(matchAllComponent) {
            config.merge({ matchAllComponent });
          },
          setIndexElement(indexComponent) {
            config.merge({ indexComponent });
          },
          addRoute(block) {
            routes.push(block);
          },
        },
      }),
      build: () => {
        const renderedRoutes = [...routes];
        const { indexComponent, matchAllComponent } = config.value();

        if (indexComponent) {
          renderedRoutes.unshift(
            TypescriptCodeUtils.wrapExpression(
              indexComponent,
              TypescriptCodeUtils.createWrapper(
                (contents) => `<Route index element={${contents}} />`,
                "import {Route} from 'react-router-dom'"
              )
            )
          );
        }

        if (matchAllComponent) {
          renderedRoutes.push(
            TypescriptCodeUtils.wrapExpression(
              matchAllComponent,
              TypescriptCodeUtils.createWrapper(
                (contents) => `<Route element={${contents}} />`,
                "import {Route} from 'react-router-dom'"
              )
            )
          );
        }

        reactApp
          .getAppFile()
          .addCodeWrapper(
            'RENDER_WRAPPERS',
            new TypescriptCodeWrapper(
              (contents) => `<BrowserRouter>${contents}</BrowserRouter>`,
              "import {BrowserRouter} from 'react-router-dom'"
            )
          );

        const expression = TypescriptCodeUtils.mergeExpressions(renderedRoutes);
        reactApp.getAppFile().addCodeExpression(
          'RENDER_ROOT',
          TypescriptCodeUtils.wrapExpression(
            expression,
            TypescriptCodeUtils.createWrapper(
              (contents) =>
                contents ? `<Routes>${contents}</Routes>` : `<Routes />`,
              "import {Routes} from 'react-router-dom'"
            )
          )
        );
      },
    };
  },
});

export default ReactRouterGenerator;
