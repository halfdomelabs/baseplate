import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH_PLACEHOLDER_AUTH_HOOKS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Placeholder generator for auth hooks.
 *
 * Useful for creating a test auth implementation.
 */
export const placeholderAuthHooksGenerator = createGenerator({
  name: 'auth/placeholder-auth-hooks',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH_PLACEHOLDER_AUTH_HOOKS_GENERATED.paths.task,
    imports: AUTH_PLACEHOLDER_AUTH_HOOKS_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: AUTH_PLACEHOLDER_AUTH_HOOKS_GENERATED.paths.provider,
      },
      run({ typescriptFile, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroupV2({
                group:
                  AUTH_PLACEHOLDER_AUTH_HOOKS_GENERATED.templates.hooksGroup,
                paths,
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
