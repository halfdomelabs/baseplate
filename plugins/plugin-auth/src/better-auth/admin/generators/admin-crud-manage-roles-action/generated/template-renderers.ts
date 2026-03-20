import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  graphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { BETTER_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_PATHS } from './template-paths.js';
import { BETTER_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES } from './typed-templates.js';

export interface BetterAuthAdminAdminCrudManageRolesActionRenderers {
  roleManagerDialog: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES.roleManagerDialog
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const betterAuthAdminAdminCrudManageRolesActionRenderers =
  createProviderType<BetterAuthAdminAdminCrudManageRolesActionRenderers>(
    'better-auth-admin-admin-crud-manage-roles-action-renderers',
  );

const betterAuthAdminAdminCrudManageRolesActionRenderersTask =
  createGeneratorTask({
    dependencies: {
      graphqlImports: graphqlImportsProvider,
      paths: BETTER_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_PATHS.provider,
      reactComponentsImports: reactComponentsImportsProvider,
      typescriptFile: typescriptFileProvider,
    },
    exports: {
      betterAuthAdminAdminCrudManageRolesActionRenderers:
        betterAuthAdminAdminCrudManageRolesActionRenderers.export(),
    },
    run({ graphqlImports, paths, reactComponentsImports, typescriptFile }) {
      return {
        providers: {
          betterAuthAdminAdminCrudManageRolesActionRenderers: {
            roleManagerDialog: {
              render: (options) =>
                typescriptFile.renderTemplateFile({
                  template:
                    BETTER_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES.roleManagerDialog,
                  destination: paths.roleManagerDialog,
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

export const BETTER_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_RENDERERS = {
  provider: betterAuthAdminAdminCrudManageRolesActionRenderers,
  task: betterAuthAdminAdminCrudManageRolesActionRenderersTask,
};
