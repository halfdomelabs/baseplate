import {
  projectScope,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { authHooksImportsProvider } from '../_providers/auth-hooks.js';
import { createPlaceholderAuthHooksImports } from './generated/ts-import-maps.js';
import { AUTH_PLACEHOLDER_AUTH_HOOKS_TS_TEMPLATES } from './generated/ts-templates.js';

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
    authHooksImports: createGeneratorTask({
      exports: {
        authHooksImports: authHooksImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            authHooksImports: createPlaceholderAuthHooksImports('@/src/hooks'),
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
      },
      run({ typescriptFile }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: AUTH_PLACEHOLDER_AUTH_HOOKS_TS_TEMPLATES.hooksGroup,
                baseDirectory: '@/src/hooks',
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
