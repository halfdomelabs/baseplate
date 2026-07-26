import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import {
  authorizerUtilsImportsProvider,
  authorizerUtilsImportsSchema,
} from '#src/generators/auth/_providers/authorizer-utils-imports.js';

import { PRISMA_PRISMA_AUTHORIZER_UTILS_PATHS } from './template-paths.js';

export const prismaAuthorizerUtilsImportsSchema = createTsImportMapSchema({
  ActionGrant: { isTypeOnly: true },
  ActionMembers: { isTypeOnly: true },
  AllRole: { isTypeOnly: true },
  AuthenticatedLeaf: { isTypeOnly: true },
  AuthoredRole: { isTypeOnly: true },
  cachedSet: {},
  CheckRole: { isTypeOnly: true },
  createModelPolicy: {},
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
});

export type PrismaAuthorizerUtilsImportsProvider =
  TsImportMapProviderFromSchema<typeof prismaAuthorizerUtilsImportsSchema>;

export const prismaAuthorizerUtilsImportsProvider =
  createReadOnlyProviderType<PrismaAuthorizerUtilsImportsProvider>(
    'prisma-authorizer-utils-imports',
  );

const prismaPrismaAuthorizerUtilsImportsTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_PRISMA_AUTHORIZER_UTILS_PATHS.provider,
  },
  exports: {
    authorizerUtilsImports: authorizerUtilsImportsProvider.export(packageScope),
    prismaAuthorizerUtilsImports:
      prismaAuthorizerUtilsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authorizerUtilsImports: createTsImportMap(
          authorizerUtilsImportsSchema,
          {
            checkGlobalAuthorization: paths.fieldGates,
            checkInstanceAuthorization: paths.fieldGates,
            GlobalRoleCheck: paths.fieldGates,
            InstanceRoleCheck: paths.fieldGates,
          },
        ),
        prismaAuthorizerUtilsImports: createTsImportMap(
          prismaAuthorizerUtilsImportsSchema,
          {
            ActionGrant: paths.types,
            ActionMembers: paths.types,
            AllRole: paths.types,
            AuthenticatedLeaf: paths.types,
            AuthoredRole: paths.types,
            cachedSet: paths.createModelPolicy,
            CheckRole: paths.types,
            createModelPolicy: paths.createModelPolicy,
            DelegationTarget: paths.types,
            Exists: paths.types,
            HasRoleLeaf: paths.types,
            LocallyComparable: paths.types,
            LocalMatch: paths.types,
            MatchRole: paths.types,
            ModelDelegate: paths.types,
            NonEmptyArray: paths.types,
            PolicyRoleMembers: paths.types,
            PredicateRole: paths.types,
            RoleBuilder: paths.types,
            RoleNode: paths.types,
            SomeRole: paths.types,
            ToOneRelationKeys: paths.types,
            UserMatchRole: paths.types,
            UserWhereRole: paths.types,
            ViaLink: paths.types,
            ViaRole: paths.types,
          },
        ),
      },
    };
  },
});

export const PRISMA_PRISMA_AUTHORIZER_UTILS_IMPORTS = {
  task: prismaPrismaAuthorizerUtilsImportsTask,
};
