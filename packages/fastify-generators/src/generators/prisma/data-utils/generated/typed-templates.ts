import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authorizerUtilsImportsProvider } from '#src/generators/auth/_providers/authorizer-utils-imports.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { prismaGeneratedImportsProvider } from '#src/generators/prisma/_providers/prisma-generated-imports.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/generated/ts-import-providers.js';

const commitOperations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {
    authorizerUtilsImports: authorizerUtilsImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'commit-operations',
  projectExports: {
    commitCreate: { isTypeOnly: false },
    commitUpdate: { isTypeOnly: false },
    commitDelete: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: {
    fieldUtils: {},
    prismaTypes: {},
    prismaUtils: {},
    types: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/commit-operations.ts',
    ),
  },
  variables: {},
});

const composeOperations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {
    authorizerUtilsImports: authorizerUtilsImportsProvider,
  },
  name: 'compose-operations',
  projectExports: {
    composeCreate: { isTypeOnly: false },
    composeUpdate: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { fieldUtils: {}, prismaTypes: {}, types: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/compose-operations.ts',
    ),
  },
  variables: {},
});

const fieldDefinitions = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: { prismaImports: prismaImportsProvider },
  name: 'field-definitions',
  projectExports: {
    createParentModelConfig: { isTypeOnly: false },
    nestedOneToManyField: { isTypeOnly: false },
    NestedOneToManyFieldConfig: { isTypeOnly: true },
    nestedOneToOneField: { isTypeOnly: false },
    NestedOneToOneFieldConfig: { isTypeOnly: true },
    ParentModelConfig: { isTypeOnly: true },
    scalarField: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: {
    fieldUtils: {},
    prismaTypes: {},
    prismaUtils: {},
    types: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/field-definitions.ts',
    ),
  },
  variables: {},
});

const fieldUtils = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'field-utils',
  projectExports: {
    generateCreateSchema: { isTypeOnly: false },
    generateUpdateSchema: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { types: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/field-utils.ts',
    ),
  },
  variables: {},
});

const prismaTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'prisma-types',
  projectExports: {
    GetPayload: { isTypeOnly: true },
    ModelPropName: { isTypeOnly: true },
    ModelQuery: { isTypeOnly: true },
    WhereUniqueInput: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/prisma-types.ts',
    ),
  },
  variables: {},
});

const prismaUtils = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {},
  name: 'prisma-utils',
  referencedGeneratorTemplates: { prismaTypes: {}, types: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/prisma-utils.ts',
    ),
  },
  variables: {},
});

const relationHelpers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {},
  name: 'relation-helpers',
  projectExports: { relationHelpers: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/relation-helpers.ts',
    ),
  },
  variables: {},
});

const types = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {
    authorizerUtilsImports: authorizerUtilsImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'types',
  projectExports: {
    AnyFieldDefinition: { isTypeOnly: true },
    AnyOperationHooks: { isTypeOnly: true },
    DataCreateInput: { isTypeOnly: true },
    DataDeleteInput: { isTypeOnly: true },
    DataOperationType: { isTypeOnly: true },
    DataUpdateInput: { isTypeOnly: true },
    FieldContext: { isTypeOnly: true },
    FieldDefinition: { isTypeOnly: true },
    FieldTransformData: { isTypeOnly: true },
    FieldTransformResult: { isTypeOnly: true },
    InferFieldsOutput: { isTypeOnly: true },
    InferInput: { isTypeOnly: true },
    OperationContext: { isTypeOnly: true },
    OperationHooks: { isTypeOnly: true },
    PrismaTransaction: { isTypeOnly: true },
    TransactionalOperationContext: { isTypeOnly: true },
  },
  referencedGeneratorTemplates: { prismaTypes: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/types.ts',
    ),
  },
  variables: {},
});

export const dataOperationsGroup = {
  commitOperations,
  composeOperations,
  fieldDefinitions,
  fieldUtils,
  prismaTypes,
  prismaUtils,
  relationHelpers,
  types,
};

export const PRISMA_DATA_UTILS_TEMPLATES = { dataOperationsGroup };
