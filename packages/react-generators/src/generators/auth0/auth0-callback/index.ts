import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { authHooksProvider } from '@src/generators/auth/auth-hooks/index.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';
import { reactErrorProvider } from '@src/generators/core/react-error/index.js';
import { reactRoutesProvider } from '@src/providers/routes.js';

const descriptorSchema = z.object({});

export const auth0CallbackGenerator = createGenerator({
  name: 'auth0/auth0-callback',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        typescript: typescriptProvider,
        reactComponents: reactComponentsProvider,
        authHooks: authHooksProvider,
        reactError: reactErrorProvider,
        reactRoutes: reactRoutesProvider,
      },
      run({ typescript, reactComponents, authHooks, reactError, reactRoutes }) {
        const [callbackPageImport, callbackPagePath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/auth0-callback.page.tsx`,
        );
        const [signupPageImport, signupPagePath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/signup.page.tsx`,
        );

        return {
          build: async (builder) => {
            reactRoutes.registerRoute({
              path: 'auth0-callback',
              element: new TypescriptCodeExpression(
                `<Auth0CallbackPage />`,
                `import Auth0CallbackPage from '${callbackPageImport}'`,
              ),
            });

            await builder.apply(
              typescript.createCopyAction({
                source: 'auth0-callback.page.tsx',
                destination: callbackPagePath,
                importMappers: [reactComponents, authHooks, reactError],
              }),
            );
            reactRoutes.registerRoute({
              path: 'signup',
              element: new TypescriptCodeExpression(
                `<SignupPage />`,
                `import SignupPage from '${signupPageImport}'`,
              ),
            });

            await builder.apply(
              typescript.createCopyAction({
                source: 'signup.page.tsx',
                destination: signupPagePath,
                importMappers: [reactComponents, reactError],
              }),
            );
          },
        };
      },
    }),
  ],
});
