import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  graphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { BETTER_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_PATHS } from './template-paths.js';
import { BETTER_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES } from './typed-templates.js';

export interface BetterAuthAdminAdminCrudResetPasswordActionRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof BETTER_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const betterAuthAdminAdminCrudResetPasswordActionRenderers =
  createProviderType<BetterAuthAdminAdminCrudResetPasswordActionRenderers>(
    'better-auth-admin-admin-crud-reset-password-action-renderers',
  );

const betterAuthAdminAdminCrudResetPasswordActionRenderersTask =
  createGeneratorTask({
    dependencies: {
      graphqlImports: graphqlImportsProvider,
      paths: BETTER_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_PATHS.provider,
      reactComponentsImports: reactComponentsImportsProvider,
      typescriptFile: typescriptFileProvider,
    },
    exports: {
      betterAuthAdminAdminCrudResetPasswordActionRenderers:
        betterAuthAdminAdminCrudResetPasswordActionRenderers.export(),
    },
    run({ graphqlImports, paths, reactComponentsImports, typescriptFile }) {
      return {
        providers: {
          betterAuthAdminAdminCrudResetPasswordActionRenderers: {
            mainGroup: {
              render: (options) =>
                typescriptFile.renderTemplateGroup({
                  group:
                    BETTER_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES.mainGroup,
                  paths,
                  importMapProviders: {
                    graphqlImports,
                    reactComponentsImports,
                  },
                  ...options,
                }),
            },
          },
        },
      };
    },
  });

export const BETTER_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_RENDERERS = {
  provider: betterAuthAdminAdminCrudResetPasswordActionRenderers,
  task: betterAuthAdminAdminCrudResetPasswordActionRenderersTask,
};
