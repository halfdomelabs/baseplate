import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  graphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const roleManagerDialog = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    graphqlImports: graphqlImportsProvider,
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

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_TEMPLATES = {
  roleManagerDialog,
};
