import {
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { apolloErrorProvider } from '@src/generators/apollo/apollo-error/apollo-error.generator.js';
import { reactApolloProvider } from '@src/generators/apollo/react-apollo/react-apollo.generator.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/react-components.generator.js';
import { reactErrorProvider } from '@src/generators/core/react-error/react-error.generator.js';
import { reactRoutesProvider } from '@src/providers/routes.js';
import { createRouteElement } from '@src/utils/routes.js';

import { authServiceProvider } from '../auth-service/auth-service.generator.js';

const descriptorSchema = z.object({
  allowedRoles: z.array(z.string().min(1)),
});

export type AuthLoginPageProvider = unknown;

export const authLoginPageProvider =
  createProviderType<AuthLoginPageProvider>('auth-login-page');

export const authLoginPageGenerator = createGenerator({
  name: 'auth/auth-login-page',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ allowedRoles }) => ({
    main: createGeneratorTask({
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
        authLoginPage: authLoginPageProvider.export(projectScope),
      },
      run({
        reactApollo,
        reactRoutes,
        typescript,
        authService,
        reactError,
        apolloError,
        reactComponents,
      }) {
        const rootFolder = `${reactRoutes.getDirectoryBase()}/Login`;
        const [loginPageImport, loginPagePath] = makeImportAndFilePath(
          `${rootFolder}/index.tsx`,
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
          },
        );
        loginPageFile.addCodeEntries({
          ALLOWED_ROLES: TypescriptCodeUtils.mergeExpressionsAsArray(
            allowedRoles.map(quot),
          ),
        });

        reactRoutes.registerRoute({
          path: 'login',
          layoutKey: 'auth',
          element: createRouteElement('LoginPage', loginPageImport),
        });

        return {
          providers: {
            authLoginPage: {},
          },
          build: async (builder) => {
            await builder.apply(
              loginPageFile.renderToAction('index.tsx', loginPagePath),
            );

            const loginGqlPath = `${rootFolder}/login.gql`;
            reactApollo.registerGqlFile(loginGqlPath);
            await builder.apply(
              copyFileAction({
                source: 'login.gql',
                destination: loginGqlPath,
              }),
            );
          },
        };
      },
    }),
  }),
});
