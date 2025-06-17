import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const useCurrentUser = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
  },
  name: 'use-current-user',
  projectExports: { useCurrentUser: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/useCurrentUser.ts',
    ),
  },
  variables: { TPL_USER: {} },
});

const useLogOut = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: { reactErrorImports: reactErrorImportsProvider },
  name: 'use-log-out',
  projectExports: { useLogOut: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/hooks/useLogOut.ts'),
  },
  variables: {},
});

const useRequiredUserId = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-required-user-id',
  projectExports: { useRequiredUserId: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/useRequiredUserId.ts',
    ),
  },
  variables: {},
});

const useSession = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-session',
  projectExports: { SessionData: { isTypeOnly: true }, useSession: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/useSession.ts',
    ),
  },
  variables: {},
});

export const hooksGroup = {
  useCurrentUser,
  useLogOut,
  useRequiredUserId,
  useSession,
};

const useCurrentUserGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'use-current-user-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/useCurrentUser.gql',
    ),
  },
  variables: {
    TPL_USER_QUERY_NAME: { description: 'The name of the user query' },
  },
});

export const AUTH0_AUTH0_HOOKS_TEMPLATES = { useCurrentUserGql, hooksGroup };
