import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { authHooksProvider } from '@src/generators/auth/auth-hooks';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactErrorProvider } from '@src/generators/core/react-error';
import { reactRoutesProvider } from '@src/providers/routes';

const descriptorSchema = z.object({});

const Auth0CallbackGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    reactComponents: reactComponentsProvider,
    authHooks: authHooksProvider,
    reactError: reactErrorProvider,
    reactRoutes: reactRoutesProvider,
  },
  createGenerator(
    descriptor,
    { typescript, reactComponents, authHooks, reactError, reactRoutes }
  ) {
    const [callbackPageImport, callbackPagePath] = makeImportAndFilePath(
      `${reactRoutes.getDirectoryBase()}/auth0-callback.page.tsx`
    );
    const [signupPageImport, signupPagePath] = makeImportAndFilePath(
      `${reactRoutes.getDirectoryBase()}/signup.page.tsx`
    );

    return {
      build: async (builder) => {
        reactRoutes.registerRoute({
          path: 'auth0-callback',
          element: new TypescriptCodeExpression(
            `<Auth0CallbackPage />`,
            `import Auth0CallbackPage from '${callbackPageImport}'`
          ),
        });

        await builder.apply(
          typescript.createCopyAction({
            source: 'auth0-callback.page.tsx',
            destination: callbackPagePath,
            importMappers: [reactComponents, authHooks, reactError],
          })
        );
        reactRoutes.registerRoute({
          path: 'signup',
          element: new TypescriptCodeExpression(
            `<SignupPage />`,
            `import SignupPage from '${signupPageImport}'`
          ),
        });

        await builder.apply(
          typescript.createCopyAction({
            source: 'signup.page.tsx',
            destination: signupPagePath,
            importMappers: [reactComponents, reactError],
          })
        );
      },
    };
  },
});

export default Auth0CallbackGenerator;
