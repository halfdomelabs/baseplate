import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  apolloErrorImportsProvider,
  graphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_INVITE_USER_ACTION_PATHS } from './template-paths.js';
import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_INVITE_USER_ACTION_TEMPLATES } from './typed-templates.js';

export interface LocalAuthAdminAdminCrudInviteUserActionRenderers {
  inviteUserDialog: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_ADMIN_ADMIN_CRUD_INVITE_USER_ACTION_TEMPLATES.inviteUserDialog
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const localAuthAdminAdminCrudInviteUserActionRenderers =
  createProviderType<LocalAuthAdminAdminCrudInviteUserActionRenderers>(
    'local-auth-admin-admin-crud-invite-user-action-renderers',
  );

const localAuthAdminAdminCrudInviteUserActionRenderersTask =
  createGeneratorTask({
    dependencies: {
      apolloErrorImports: apolloErrorImportsProvider,
      graphqlImports: graphqlImportsProvider,
      paths: LOCAL_AUTH_ADMIN_ADMIN_CRUD_INVITE_USER_ACTION_PATHS.provider,
      reactComponentsImports: reactComponentsImportsProvider,
      reactErrorImports: reactErrorImportsProvider,
      typescriptFile: typescriptFileProvider,
    },
    exports: {
      localAuthAdminAdminCrudInviteUserActionRenderers:
        localAuthAdminAdminCrudInviteUserActionRenderers.export(),
    },
    run({
      apolloErrorImports,
      graphqlImports,
      paths,
      reactComponentsImports,
      reactErrorImports,
      typescriptFile,
    }) {
      return {
        providers: {
          localAuthAdminAdminCrudInviteUserActionRenderers: {
            inviteUserDialog: {
              render: (options) =>
                typescriptFile.renderTemplateFile({
                  template:
                    LOCAL_AUTH_ADMIN_ADMIN_CRUD_INVITE_USER_ACTION_TEMPLATES.inviteUserDialog,
                  destination: paths.inviteUserDialog,
                  importMapProviders: {
                    apolloErrorImports,
                    graphqlImports,
                    reactComponentsImports,
                    reactErrorImports,
                  },
                  ...options,
                }),
            },
          },
        },
      };
    },
  });

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_INVITE_USER_ACTION_RENDERERS = {
  provider: localAuthAdminAdminCrudInviteUserActionRenderers,
  task: localAuthAdminAdminCrudInviteUserActionRenderersTask,
};
