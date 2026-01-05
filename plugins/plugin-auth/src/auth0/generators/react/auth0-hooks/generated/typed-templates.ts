import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { reactErrorImportsProvider } from '@baseplate-dev/react-generators';
import path from 'node:path';

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

export const hooksGroup = { useLogOut, useRequiredUserId, useSession };

export const AUTH0_AUTH0_HOOKS_TEMPLATES = { hooksGroup };
