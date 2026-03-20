import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authRolesImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const seedInitialUser = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'seed-initial-user',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/prisma/seed-initial-user.ts',
    ),
  },
  variables: { TPL_INITIAL_USER_ROLES: {} },
});

export const BETTER_AUTH_SEED_INITIAL_USER_TEMPLATES = { seedInitialUser };
