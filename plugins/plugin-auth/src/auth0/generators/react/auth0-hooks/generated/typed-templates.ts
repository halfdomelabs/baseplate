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
  referencedGeneratorTemplates: { useSession: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-current-user.ts',
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
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-log-out.ts',
    ),
  },
  variables: {},
});

const useRequiredUserId = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-required-user-id',
  projectExports: { useRequiredUserId: {} },
  referencedGeneratorTemplates: { useSession: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-required-user-id.ts',
    ),
  },
  variables: {},
});

const useSession = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-session',
  projectExports: {
    AuthRole: { isTypeOnly: true },
    SessionData: { isTypeOnly: true },
    useSession: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-session.ts',
    ),
  },
  variables: { TPL_AUTH_ROLES: {} },
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
      '../templates/src/hooks/use-current-user.gql',
    ),
  },
  variables: {
    TPL_USER_QUERY_NAME: { description: 'The name of the user query' },
  },
});

export const AUTH0_AUTH0_HOOKS_TEMPLATES = { hooksGroup, useCurrentUserGql };
