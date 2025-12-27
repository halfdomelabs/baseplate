import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { prismaGeneratedImportsProvider } from '#src/generators/prisma/_providers/prisma-generated-imports.js';
import { authorizerUtilsImportsProvider } from '#src/generators/prisma/authorizer-utils/generated/ts-import-providers.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/generated/ts-import-providers.js';

const defineOperations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {
    authorizerUtilsImports: authorizerUtilsImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'define-operations',
  projectExports: {
    defineCreateOperation: { isTypeOnly: false },
    defineDeleteOperation: { isTypeOnly: false },
    defineUpdateOperation: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { prismaTypes: {}, prismaUtils: {}, types: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/define-operations.ts',
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
    defineOperations: {},
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
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'types',
  projectExports: {
    AnyFieldDefinition: { isTypeOnly: true },
    AnyOperationHooks: { isTypeOnly: true },
    DataOperationType: { isTypeOnly: true },
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
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/types.ts',
    ),
  },
  variables: {},
});

export const dataOperationsGroup = {
  defineOperations,
  fieldDefinitions,
  prismaTypes,
  prismaUtils,
  relationHelpers,
  types,
};

export const PRISMA_DATA_UTILS_TEMPLATES = { dataOperationsGroup };
