import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authRolesImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { betterAuthModuleImportsProvider } from '#src/better-auth/generators/fastify/better-auth-module/generated/ts-import-providers.js';

const seedInitialUser = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    betterAuthModuleImports: betterAuthModuleImportsProvider,
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

export const BETTER_AUTH_SEED_INITIAL_USER_TEMPLATES = { seedInitialUser };
