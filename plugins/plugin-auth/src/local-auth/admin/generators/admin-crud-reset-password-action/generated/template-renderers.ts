import type {
  RenderTextTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
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

import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_PATHS } from './template-paths.js';
import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES } from './typed-templates.js';

export interface LocalAuthAdminAdminCrudResetPasswordActionRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  passwordResetDialogGql: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES.passwordResetDialogGql
        >,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
}

const localAuthAdminAdminCrudResetPasswordActionRenderers =
  createProviderType<LocalAuthAdminAdminCrudResetPasswordActionRenderers>(
    'local-auth-admin-admin-crud-reset-password-action-renderers',
  );

const localAuthAdminAdminCrudResetPasswordActionRenderersTask =
  createGeneratorTask({
    dependencies: {
      generatedGraphqlImports: generatedGraphqlImportsProvider,
      paths: LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_PATHS.provider,
      reactComponentsImports: reactComponentsImportsProvider,
      typescriptFile: typescriptFileProvider,
    },
    exports: {
      localAuthAdminAdminCrudResetPasswordActionRenderers:
        localAuthAdminAdminCrudResetPasswordActionRenderers.export(),
    },
    run({
      generatedGraphqlImports,
      paths,
      reactComponentsImports,
      typescriptFile,
    }) {
      return {
        providers: {
          localAuthAdminAdminCrudResetPasswordActionRenderers: {
            mainGroup: {
              render: (options) =>
                typescriptFile.renderTemplateGroup({
                  group:
                    LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES.mainGroup,
                  paths,
                  importMapProviders: {
                    generatedGraphqlImports,
                    reactComponentsImports,
                  },
                  ...options,
                }),
            },
            passwordResetDialogGql: {
              render: (options) =>
                renderTextTemplateFileAction({
                  template:
                    LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES.passwordResetDialogGql,
                  destination: paths.passwordResetDialogGql,
                  ...options,
                }),
            },
          },
        },
      };
    },
  });

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_RENDERERS = {
  provider: localAuthAdminAdminCrudResetPasswordActionRenderers,
  task: localAuthAdminAdminCrudResetPasswordActionRenderersTask,
};
