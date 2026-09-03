import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

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

const useUserIdOrThrow = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-user-id-or-throw',
  projectExports: { useUserIdOrThrow: {} },
  referencedGeneratorTemplates: { useSession: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-user-id-or-throw.ts',
    ),
  },
  variables: {},
});

export const hooksGroup = { useLogOut, useSession, useUserIdOrThrow };

export const PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_TEMPLATES = {
  hooksGroup,
};
