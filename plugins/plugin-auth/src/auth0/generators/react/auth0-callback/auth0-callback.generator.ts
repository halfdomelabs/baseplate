import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH0_AUTH0_CALLBACK_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const auth0CallbackGenerator = createGenerator({
  name: 'auth0/auth0-callback',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH0_AUTH0_CALLBACK_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        authHooksImports: authHooksImportsProvider,
        reactErrorImports: reactErrorImportsProvider,
        paths: AUTH0_AUTH0_CALLBACK_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        reactComponentsImports,
        authHooksImports,
        reactErrorImports,
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  AUTH0_AUTH0_CALLBACK_GENERATED.templates.auth0CallbackPage,
                destination: paths.auth0CallbackPage,
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                  reactErrorImports,
                },
              }),
            );

            // Signup page
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH0_AUTH0_CALLBACK_GENERATED.templates.signupPage,
                destination: paths.signupPage,
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
