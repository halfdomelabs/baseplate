import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authContextImportsProvider } from '#src/generators/auth/auth-context/generated/ts-import-providers.js';
import { authRolesImportsProvider } from '#src/generators/auth/auth-roles/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { prismaGeneratedImportsProvider } from '#src/generators/prisma/_providers/prisma-generated-imports.js';
import { dataUtilsImportsProvider } from '#src/generators/prisma/data-utils/generated/ts-import-providers.js';
import { prismaQueryFilterUtilsImportsProvider } from '#src/generators/prisma/prisma-query-filter-utils/generated/ts-import-providers.js';

const createModelPolicy = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    dataUtilsImports: dataUtilsImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaQueryFilterUtilsImports: prismaQueryFilterUtilsImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'create-model-policy',
  projectExports: {
    cachedSet: { isTypeOnly: false },
    createModelPolicy: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { types: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/authorizers/create-model-policy.ts',
    ),
  },
  variables: {},
});

const fieldGates = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'field-gates',
  projectExports: {
    checkGlobalAuthorization: { isTypeOnly: false },
    checkInstanceAuthorization: { isTypeOnly: false },
    GlobalRoleCheck: { isTypeOnly: true },
    InstanceRoleCheck: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/authorizers/field-gates.ts',
    ),
  },
  variables: {},
});

const types = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    authContextImports: authContextImportsProvider,
    dataUtilsImports: dataUtilsImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaQueryFilterUtilsImports: prismaQueryFilterUtilsImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'types',
  projectExports: {
    ActionGrant: { isTypeOnly: true },
    ActionMembers: { isTypeOnly: true },
    AllRole: { isTypeOnly: true },
    AuthenticatedLeaf: { isTypeOnly: true },
    AuthoredRole: { isTypeOnly: true },
    CheckRole: { isTypeOnly: true },
    DelegationTarget: { isTypeOnly: true },
    Exists: { isTypeOnly: true },
    HasRoleLeaf: { isTypeOnly: true },
    LocallyComparable: { isTypeOnly: true },
    LocalMatch: { isTypeOnly: true },
    MatchRole: { isTypeOnly: true },
    ModelDelegate: { isTypeOnly: true },
    NonEmptyArray: { isTypeOnly: true },
    PolicyRoleMembers: { isTypeOnly: true },
    PredicateRole: { isTypeOnly: true },
    RoleBuilder: { isTypeOnly: true },
    RoleNode: { isTypeOnly: true },
    SomeRole: { isTypeOnly: true },
    ToOneRelationKeys: { isTypeOnly: true },
    UserMatchRole: { isTypeOnly: true },
    UserWhereRole: { isTypeOnly: true },
    ViaLink: { isTypeOnly: true },
    ViaRole: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/authorizers/types.ts',
    ),
  },
  variables: {},
});

export const mainGroup = { createModelPolicy, fieldGates, types };

export const PRISMA_PRISMA_AUTHORIZER_UTILS_TEMPLATES = { mainGroup };
