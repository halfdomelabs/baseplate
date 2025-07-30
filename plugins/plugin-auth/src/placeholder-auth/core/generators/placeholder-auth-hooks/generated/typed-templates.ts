import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import { generatedGraphqlImportsProvider } from '@baseplate-dev/react-generators';
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
  variables: {},
});

const useLogOut = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
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
  importMapProviders: {},
  name: 'use-session',
  projectExports: {
    SessionData: { isTypeOnly: true },
    useSession: {},
    AuthRole: { isTypeOnly: true },
  },
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

const useCurrentUserGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'use-current-user-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-current-user.gql',
    ),
  },
  variables: {},
});

export const PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_TEMPLATES = {
  hooksGroup,
  useCurrentUserGql,
};
