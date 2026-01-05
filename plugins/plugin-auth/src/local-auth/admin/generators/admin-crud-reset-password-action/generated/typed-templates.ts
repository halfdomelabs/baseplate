import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  graphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const passwordResetDialog = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    graphqlImports: graphqlImportsProvider,
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

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_TEMPLATES = {
  mainGroup,
};
