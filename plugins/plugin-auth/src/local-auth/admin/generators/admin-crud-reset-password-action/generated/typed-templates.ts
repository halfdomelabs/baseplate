import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const passwordResetDialog = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'password-reset-dialog',
  projectExports: {},
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/-components/password-reset-dialog.tsx',
    ),
  },
  variables: {},
});

export const mainGroup = { passwordResetDialog };

const passwordResetDialogGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'password-reset-dialog-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/-components/password-reset-dialog.gql',
    ),
  },
  variables: { TPL_USER_ROW_FRAGMENT: {} },
});

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES = {
  mainGroup,
  passwordResetDialogGql,
};
