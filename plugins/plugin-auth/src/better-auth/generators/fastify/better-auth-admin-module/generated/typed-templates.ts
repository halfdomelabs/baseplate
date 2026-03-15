import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authRolesImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const adminAuthMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'admin-auth-mutations',
  referencedGeneratorTemplates: { adminAuthService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/admin-auth.mutations.ts',
    ),
  },
  variables: { TPL_ADMIN_ROLES: {}, TPL_USER_OBJECT_TYPE: {} },
});

const adminAuthService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'admin-auth-service',
  projectExports: { resetUserPassword: {}, updateUserRoles: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/admin-auth.service.ts',
    ),
  },
  variables: {},
});

export const BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_TEMPLATES = {
  adminAuthMutations,
  adminAuthService,
};
