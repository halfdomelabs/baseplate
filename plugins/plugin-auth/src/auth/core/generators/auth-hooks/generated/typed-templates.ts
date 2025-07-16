import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

import { reactSessionImportsProvider } from '#src/auth/core/generators/react-session/generated/ts-import-providers.js';

const useCurrentUserGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks-gql',
  name: 'use-current-user-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-current-user.gql',
    ),
  },
  variables: {},
});

const useLogOutGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks-gql',
  name: 'use-log-out-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-log-out.gql',
    ),
  },
  variables: {},
});

export const hooksGqlGroup = { useCurrentUserGql, useLogOutGql };

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
  variables: {},
});

const useLogOut = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    reactSessionImports: reactSessionImportsProvider,
  },
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
      '../templates/src/hooks/use-user-id-or-throw.ts',
    ),
  },
  variables: {},
});

const useSession = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: { reactSessionImports: reactSessionImportsProvider },
  name: 'use-session',
  projectExports: { SessionData: { isTypeOnly: true }, useSession: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-session.ts',
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

export const AUTH_CORE_AUTH_HOOKS_TEMPLATES = { hooksGqlGroup, hooksGroup };
