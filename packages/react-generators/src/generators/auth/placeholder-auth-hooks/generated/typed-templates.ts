import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const useCurrentUser = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-current-user',
  projectExports: { useCurrentUser: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/useCurrentUser.ts',
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

export const AUTH_PLACEHOLDER_AUTH_HOOKS_TEMPLATES = { hooksGroup };
