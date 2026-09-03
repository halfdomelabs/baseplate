import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { reactErrorImportsProvider } from '@baseplate-dev/react-generators';
import path from 'node:path';

import { betterAuthImportsProvider } from '#src/better-auth/generators/react/react-better-auth/generated/ts-import-providers.js';

const useLogOut = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {
    betterAuthImports: betterAuthImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
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

const useSession = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: { betterAuthImports: betterAuthImportsProvider },
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

export const BETTER_AUTH_BETTER_AUTH_HOOKS_TEMPLATES = { hooksGroup };
