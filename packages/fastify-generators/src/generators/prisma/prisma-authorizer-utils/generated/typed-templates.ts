import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authRolesImportsProvider } from '#src/generators/auth/auth-roles/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { prismaGeneratedImportsProvider } from '#src/generators/prisma/_providers/prisma-generated-imports.js';
import { dataUtilsImportsProvider } from '#src/generators/prisma/data-utils/generated/ts-import-providers.js';
import { prismaQueryFilterUtilsImportsProvider } from '#src/generators/prisma/prisma-query-filter-utils/generated/ts-import-providers.js';

const utilsAuthorizers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    dataUtilsImports: dataUtilsImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaQueryFilterUtilsImports: prismaQueryFilterUtilsImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'utils-authorizers',
  projectExports: {
    ActionGrant: { isTypeOnly: true },
    ActionMembers: { isTypeOnly: true },
    cachedSet: { isTypeOnly: false },
    checkGlobalAuthorization: { isTypeOnly: false },
    checkInstanceAuthorization: { isTypeOnly: false },
    createModelPolicy: { isTypeOnly: false },
    GlobalRoleCheck: { isTypeOnly: true },
    InstanceRoleCheck: { isTypeOnly: true },
    PolicyRoleMembers: { isTypeOnly: true },
    RoleBuilder: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/authorizers.ts',
    ),
  },
  variables: {},
});

export const mainGroup = { utilsAuthorizers };

export const PRISMA_PRISMA_AUTHORIZER_UTILS_TEMPLATES = { mainGroup };
