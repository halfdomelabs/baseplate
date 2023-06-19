import {
  makeImportAndFilePath,
  quot,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  copyFileAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { apolloErrorProvider } from '@src/generators/apollo/apollo-error/index.js';
import { reactApolloProvider } from '@src/generators/apollo/react-apollo/index.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';
import { reactErrorProvider } from '@src/generators/core/react-error/index.js';
import { reactLinkableProvider } from '@src/providers/linkable.js';
import { reactRoutesProvider } from '@src/providers/routes.js';
import { authServiceProvider } from '../auth-service/index.js';

const descriptorSchema = z.object({
  allowedRoles: z.array(z.string().min(1)),
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
