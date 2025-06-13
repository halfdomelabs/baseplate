import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { authContextImportsProvider } from '../auth-context/index.js';
import { userSessionTypesImportsProvider } from '../user-session-types/index.js';
import { AUTH_PLACEHOLDER_AUTH_SERVICE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Placeholder generator for auth session service.
 *
 * Useful for creating a test auth implementation.
 */
export const placeholderAuthServiceGenerator = createGenerator({
  name: 'auth/placeholder-auth-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH_PLACEHOLDER_AUTH_SERVICE_GENERATED.paths.task,
    imports: AUTH_PLACEHOLDER_AUTH_SERVICE_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        userSessionTypesImports: userSessionTypesImportsProvider,
        typescriptFile: typescriptFileProvider,
        paths: AUTH_PLACEHOLDER_AUTH_SERVICE_GENERATED.paths.provider,
        authContextImports: authContextImportsProvider,
      },
      run({
        userSessionTypesImports,
        typescriptFile,
        paths,
        authContextImports,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  AUTH_PLACEHOLDER_AUTH_SERVICE_GENERATED.templates
                    .userSessionService,
                destination: paths.userSessionService,
                variables: {},
                importMapProviders: {
                  userSessionTypesImports,
                  authContextImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
