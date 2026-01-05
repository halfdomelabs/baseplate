import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  graphqlImportsProvider,
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
}

const localAuthAdminAdminCrudResetPasswordActionRenderers =
  createProviderType<LocalAuthAdminAdminCrudResetPasswordActionRenderers>(
    'local-auth-admin-admin-crud-reset-password-action-renderers',
  );

const localAuthAdminAdminCrudResetPasswordActionRenderersTask =
  createGeneratorTask({
    dependencies: {
      graphqlImports: graphqlImportsProvider,
      paths: LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_PATHS.provider,
      reactComponentsImports: reactComponentsImportsProvider,
      typescriptFile: typescriptFileProvider,
    },
    exports: {
      localAuthAdminAdminCrudResetPasswordActionRenderers:
        localAuthAdminAdminCrudResetPasswordActionRenderers.export(),
    },
    run({ graphqlImports, paths, reactComponentsImports, typescriptFile }) {
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

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_RENDERERS = {
  provider: localAuthAdminAdminCrudResetPasswordActionRenderers,
  task: localAuthAdminAdminCrudResetPasswordActionRenderersTask,
};
