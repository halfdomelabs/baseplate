import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authRolesImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { authEmailPasswordImportsProvider } from '#src/local-auth/core/generators/auth-email-password/generated/ts-import-providers.js';

const seedInitialUser = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authEmailPasswordImports: authEmailPasswordImportsProvider,
    authRolesImports: authRolesImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'seed-initial-user',
  projectExports: { seedInitialUser: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/prisma/seed-initial-user.ts',
    ),
  },
  variables: { TPL_INITIAL_USER_ROLES: {} },
});

export const LOCAL_AUTH_CORE_SEED_INITIAL_USER_TEMPLATES = { seedInitialUser };
