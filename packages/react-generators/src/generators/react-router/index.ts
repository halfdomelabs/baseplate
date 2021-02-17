import {
  mergeTypescriptCodeBlocks,
  nodeProvider,
  TypescriptCodeBlock,
  wrapTypescriptCodeBlock,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import * as yup from 'yup';
import { reactAppProvider } from '../react-app';

interface ReactRouterDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

export interface ReactRouterProvider {
  setNotFoundPageComponent(component: TypescriptCodeBlock): void;
  addRoute(block: TypescriptCodeBlock): void;
  setHomePage(homepage: string): void;
}

export const reactRouterProvider = createProviderType<ReactRouterProvider>(
  'react-router'
);

const ReactRouterGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ReactRouterDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    node: nodeProvider,
    reactApp: reactAppProvider,
  },
  exports: {
    reactRouter: reactRouterProvider,
  },
  createGenerator(descriptor, { node, reactApp }) {
    node.addPackage('react-router-dom', '^5.2.0');
    node.addDevPackage('@types/react-router-dom', '^5.1.6');
    const routes: TypescriptCodeBlock[] = [];
    const config = createNonOverwriteableMap<{
      notFoundPageComponent?: TypescriptCodeBlock;
      homepage?: string;
    }>({}, 'react-router');
    return {
      getProviders: () => {
        return {
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
        };
      },
      build: () => {
        const codeBlocks = [...routes];
        const { homepage, notFoundPageComponent } = config.value();
        if (homepage) {
          codeBlocks.push({
            code: `<Redirect path="/" exact to="${homepage}" />`,
            importText: ["import {Redirect} from 'react-router-dom'"],
          });
        }

        if (notFoundPageComponent) {
          codeBlocks.push(
            wrapTypescriptCodeBlock(
              {
                render: (contents) => `<Route component={${contents}} />`,
                importText: ["import {Route} from 'react-router-dom'"],
              },
              notFoundPageComponent
            )
          );
        }

        const codeBlock: TypescriptCodeBlock = mergeTypescriptCodeBlocks(
          codeBlocks
        );
        reactApp.getSourceFile().addCodeBlock(
          'RENDER_ROOT',
          wrapTypescriptCodeBlock(
            {
              render: (contents) =>
                `<Router><Switch>${contents}</Switch></Router>`,
              importText: [
                "import {BrowserRouter as Router,Switch} from 'react-router-dom'",
              ],
            },
            codeBlock
          )
        );
      },
    };
  },
});

export default ReactRouterGenerator;
