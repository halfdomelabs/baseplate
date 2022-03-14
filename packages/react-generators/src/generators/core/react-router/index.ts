import {
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
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
  setNotFoundPageComponent(component: TypescriptCodeExpression): void;
  addRoute(block: TypescriptCodeExpression): void;
  setHomePage(homepage: string): void;
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
    node.addPackage('react-router-dom', '^5.2.0');
    node.addDevPackage('@types/react-router-dom', '^5.1.6');
    const routes: TypescriptCodeExpression[] = [];
    const config = createNonOverwriteableMap<{
      notFoundPageComponent?: TypescriptCodeExpression;
      homepage?: string;
    }>({}, { name: 'react-router' });
    return {
      getProviders: () => ({
        reactRouter: {
          setNotFoundPageComponent(component) {
            config.merge({ notFoundPageComponent: component });
          },
          addRoute(block) {
            routes.push(block);
          },
          setHomePage(homepage) {
            config.merge({ homepage });
          },
        },
      }),
      build: () => {
        const renderedRoutes = [...routes];
        const { homepage, notFoundPageComponent } = config.value();
        if (homepage) {
          renderedRoutes.push(
            TypescriptCodeUtils.createExpression(
              `<Redirect path="/" exact to="${homepage}" />`,
              "import {Redirect} from 'react-router-dom'"
            )
          );
        }

        if (notFoundPageComponent) {
          renderedRoutes.push(
            TypescriptCodeUtils.wrapExpression(
              notFoundPageComponent,
              TypescriptCodeUtils.createWrapper(
                (contents) => `<Route component={${contents}} />`,
                "import {Route} from 'react-router-dom'"
              )
            )
          );
        }

        const expression = TypescriptCodeUtils.mergeExpressions(renderedRoutes);
        reactApp.getAppFile().addCodeExpression(
          'RENDER_ROOT',
          TypescriptCodeUtils.wrapExpression(
            expression,
            TypescriptCodeUtils.createWrapper(
              (contents) => `<Router><Switch>${contents}</Switch></Router>`,
              "import {BrowserRouter as Router,Switch} from 'react-router-dom'"
            )
          )
        );
      },
    };
  },
});

export default ReactRouterGenerator;
