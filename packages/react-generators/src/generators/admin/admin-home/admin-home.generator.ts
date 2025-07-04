import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';

import { ADMIN_ADMIN_HOME_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const adminHomeGenerator = createGenerator({
  name: 'admin/admin-home',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: ADMIN_ADMIN_HOME_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        reactComponentsImports: reactComponentsImportsProvider,
        authHooksImports: authHooksImportsProvider,
        typescriptFile: typescriptFileProvider,
        paths: ADMIN_ADMIN_HOME_GENERATED.paths.provider,
      },
      run({ authHooksImports, reactComponentsImports, typescriptFile, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_HOME_GENERATED.templates.home,
                destination: paths.home,
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
