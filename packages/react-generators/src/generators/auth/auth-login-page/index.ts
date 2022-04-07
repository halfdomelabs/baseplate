import {
  makeImportAndFilePath,
  quot,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  copyFileAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { apolloErrorProvider } from '@src/generators/apollo/apollo-error';
import { reactApolloProvider } from '@src/generators/apollo/react-apollo';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactErrorProvider } from '@src/generators/core/react-error';
import { reactLinkableProvider } from '@src/providers/linkable';
import { reactRoutesProvider } from '@src/providers/routes';
import { authServiceProvider } from '../auth-service';

const descriptorSchema = yup.object({
  allowedRoles: yup.array(yup.string().required()).required(),
});

export type AuthLoginPageProvider = unknown;

export const authLoginPageProvider =
  createProviderType<AuthLoginPageProvider>('auth-login-page');

const AuthLoginPageGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactApollo: reactApolloProvider,
    reactRoutes: reactRoutesProvider,
    typescript: typescriptProvider,
    authService: authServiceProvider,
    reactError: reactErrorProvider,
    apolloError: apolloErrorProvider,
    reactComponents: reactComponentsProvider,
  },
  exports: {
    authLoginPage: authLoginPageProvider,
    reactLinkable: reactLinkableProvider,
  },
  createGenerator(
    { allowedRoles },
    {
      reactApollo,
      reactRoutes,
      typescript,
      authService,
      reactError,
      apolloError,
      reactComponents,
    }
  ) {
    const rootFolder = `${reactRoutes.getDirectoryBase()}/Login`;
    const [loginPageImport, loginPagePath] = makeImportAndFilePath(
      `${rootFolder}/index.tsx`
    );
    const loginPageFile = typescript.createTemplate(
      {
        ALLOWED_ROLES: { type: 'code-expression' },
      },
      {
        importMappers: [
          reactComponents,
          reactApollo,
          authService,
          reactError,
          apolloError,
        ],
      }
    );
    loginPageFile.addCodeEntries({
      ALLOWED_ROLES: TypescriptCodeUtils.mergeExpressionsAsArray(
        allowedRoles.map(quot)
      ),
    });

    reactRoutes.registerRoute({
      path: 'login',
      layoutKey: 'auth',
      element: TypescriptCodeUtils.createExpression(
        `<LoginPage />`,
        `import LoginPage from '${loginPageImport}';`
      ),
    });

    return {
      getProviders: () => ({
        authLoginPage: {},
        reactLinkable: {
          getLink: () => `${reactRoutes.getRoutePrefix()}/login`,
        },
      }),
      build: async (builder) => {
        await builder.apply(
          loginPageFile.renderToAction('index.tsx', loginPagePath)
        );

        const loginGqlPath = `${rootFolder}/login.gql`;
        reactApollo.registerGqlFile(loginGqlPath);
        await builder.apply(
          copyFileAction({
            source: 'login.gql',
            destination: loginGqlPath,
            shouldFormat: true,
          })
        );
      },
    };
  },
});

export default AuthLoginPageGenerator;
