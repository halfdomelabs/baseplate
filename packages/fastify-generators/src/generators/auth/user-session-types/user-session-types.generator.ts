import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { authContextImportsProvider } from '../auth-context/index.js';
import { AUTH_USER_SESSION_TYPES_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const userSessionTypesGenerator = createGenerator({
  name: 'auth/user-session-types',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH_USER_SESSION_TYPES_GENERATED.paths.task,
    imports: AUTH_USER_SESSION_TYPES_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: AUTH_USER_SESSION_TYPES_GENERATED.paths.provider,
        authContextImports: authContextImportsProvider,
      },
      run({ typescriptFile, paths, authContextImports }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  AUTH_USER_SESSION_TYPES_GENERATED.templates.userSessionTypes,
                destination: paths.userSessionTypes,
                importMapProviders: {
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
