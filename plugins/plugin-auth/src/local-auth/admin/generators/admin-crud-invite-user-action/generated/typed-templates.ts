import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  apolloErrorImportsProvider,
  graphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const inviteUserDialog = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    apolloErrorImports: apolloErrorImportsProvider,
    graphqlImports: graphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'invite-user-dialog',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/-components/invite-user-dialog.tsx',
    ),
  },
  variables: {},
});

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_INVITE_USER_ACTION_TEMPLATES = {
  inviteUserDialog,
};
