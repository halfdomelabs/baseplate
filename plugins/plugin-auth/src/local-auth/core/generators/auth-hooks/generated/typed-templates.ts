import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  graphqlImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

import { reactSessionImportsProvider } from '#src/local-auth/core/generators/react-session/generated/ts-import-providers.js';

const useLogOut = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {
    graphqlImports: graphqlImportsProvider,
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
  importMapProviders: { graphqlImports: graphqlImportsProvider },
  name: 'use-session',
  projectExports: {
    AuthRole: {},
    AuthSessionContext: {},
    SessionData: { isTypeOnly: true },
    useSession: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-session.ts',
    ),
  },
  variables: {},
});

export const hooksGroup = { useLogOut, useRequiredUserId, useSession };

export const LOCAL_AUTH_CORE_AUTH_HOOKS_TEMPLATES = { hooksGroup };
