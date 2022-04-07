import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { ReactRoute, reactRoutesProvider } from '@src/providers/routes';
import { reactComponentsProvider } from '../react-components';

const descriptorSchema = yup.object({
  layoutKey: yup.string(),
});

export interface ReactNotFoundProvider {
  getNotFoundRoute(): ReactRoute;
}

export const reactNotFoundProvider =
  createProviderType<ReactNotFoundProvider>('react-not-found');

const ReactNotFoundHandlerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactPages: reactRoutesProvider,
    reactComponents: reactComponentsProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactNotFound: reactNotFoundProvider,
  },
  createGenerator({ layoutKey }, { reactPages, reactComponents, typescript }) {
    const [notFoundPageImport, notFoundPagePath] = makeImportAndFilePath(
      `${reactPages.getDirectoryBase()}/NotFoundPage.tsx`
    );

    const notFoundRoute = {
      path: '*',
      element: TypescriptCodeUtils.createExpression(
        `<NotFoundPage />`,
        `import NotFoundPage from '${notFoundPageImport}';`,
        {
          importMappers: [reactComponents],
        }
      ),
    };

    reactPages.registerRoute({
      ...notFoundRoute,
      layoutKey,
    });
    return {
      getProviders: () => ({
        reactNotFound: {
          getNotFoundRoute: () => notFoundRoute,
        },
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'NotFoundPage.tsx',
            destination: notFoundPagePath,
            importMappers: [reactComponents],
          })
        );
      },
    };
  },
});

export default ReactNotFoundHandlerGenerator;
