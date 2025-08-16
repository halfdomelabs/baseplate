import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const roleManagerDialog = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'role-manager-dialog',
  projectExports: {},
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/-components/role-manager-dialog.tsx',
    ),
  },
  variables: { TPL_AVAILABLE_ROLES: {} },
});

const roleManagerDialogGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'role-manager-dialog-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/-components/role-manager-dialog.gql',
    ),
  },
  variables: { TPL_USER_ROW_FRAGMENT: {} },
});

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES = {
  roleManagerDialog,
  roleManagerDialogGql,
};
