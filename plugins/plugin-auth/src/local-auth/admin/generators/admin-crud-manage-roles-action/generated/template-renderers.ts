import type {
  RenderTextTemplateFileActionInput,
  RenderTsTemplateFileActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import {
  renderTextTemplateFileAction,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_PATHS } from './template-paths.js';
import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES } from './typed-templates.js';

export interface LocalAuthAdminAdminCrudManageRolesActionRenderers {
  roleManagerDialog: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES.roleManagerDialog
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  roleManagerDialogGql: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES.roleManagerDialogGql
        >,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
}

const localAuthAdminAdminCrudManageRolesActionRenderers =
  createProviderType<LocalAuthAdminAdminCrudManageRolesActionRenderers>(
    'local-auth-admin-admin-crud-manage-roles-action-renderers',
  );

const localAuthAdminAdminCrudManageRolesActionRenderersTask =
  createGeneratorTask({
    dependencies: {
      generatedGraphqlImports: generatedGraphqlImportsProvider,
      paths: LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_PATHS.provider,
      reactComponentsImports: reactComponentsImportsProvider,
      typescriptFile: typescriptFileProvider,
    },
    exports: {
      localAuthAdminAdminCrudManageRolesActionRenderers:
        localAuthAdminAdminCrudManageRolesActionRenderers.export(),
    },
    run({
      generatedGraphqlImports,
      paths,
      reactComponentsImports,
      typescriptFile,
    }) {
      return {
        providers: {
          localAuthAdminAdminCrudManageRolesActionRenderers: {
            roleManagerDialog: {
              render: (options) =>
                typescriptFile.renderTemplateFile({
                  template:
                    LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES.roleManagerDialog,
                  destination: paths.roleManagerDialog,
                  importMapProviders: {
                    generatedGraphqlImports,
                    reactComponentsImports,
                  },
                  ...options,
                }),
            },
            roleManagerDialogGql: {
              render: (options) =>
                renderTextTemplateFileAction({
                  template:
                    LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES.roleManagerDialogGql,
                  destination: paths.roleManagerDialogGql,
                  ...options,
                }),
            },
          },
        },
      };
    },
  });

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_RENDERERS = {
  provider: localAuthAdminAdminCrudManageRolesActionRenderers,
  task: localAuthAdminAdminCrudManageRolesActionRenderersTask,
};
