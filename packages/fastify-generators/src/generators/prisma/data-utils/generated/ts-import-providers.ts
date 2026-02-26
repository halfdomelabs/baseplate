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

import { PRISMA_DATA_UTILS_PATHS } from './template-paths.js';

export const dataUtilsImportsSchema = createTsImportMapSchema({
  AnyFieldDefinition: { isTypeOnly: true },
  AnyOperationHooks: { isTypeOnly: true },
  commitCreate: {},
  commitDelete: {},
  commitUpdate: {},
  composeCreate: {},
  composeUpdate: {},
  createParentModelConfig: {},
  DataCreateInput: { isTypeOnly: true },
  DataDeleteInput: { isTypeOnly: true },
  DataOperationType: { isTypeOnly: true },
  DataUpdateInput: { isTypeOnly: true },
  FieldContext: { isTypeOnly: true },
  FieldDefinition: { isTypeOnly: true },
  FieldTransformData: { isTypeOnly: true },
  FieldTransformResult: { isTypeOnly: true },
  generateCreateSchema: {},
  generateUpdateSchema: {},
  GetPayload: { isTypeOnly: true },
  InferFieldsOutput: { isTypeOnly: true },
  InferInput: { isTypeOnly: true },
  ModelPropName: { isTypeOnly: true },
  ModelQuery: { isTypeOnly: true },
  nestedOneToManyField: {},
  NestedOneToManyFieldConfig: { isTypeOnly: true },
  nestedOneToOneField: {},
  NestedOneToOneFieldConfig: { isTypeOnly: true },
  OperationContext: { isTypeOnly: true },
  OperationHooks: { isTypeOnly: true },
  ParentModelConfig: { isTypeOnly: true },
  PrismaTransaction: { isTypeOnly: true },
  relationHelpers: {},
  scalarField: {},
  TransactionalOperationContext: { isTypeOnly: true },
  WhereUniqueInput: { isTypeOnly: true },
});

export type DataUtilsImportsProvider = TsImportMapProviderFromSchema<
  typeof dataUtilsImportsSchema
>;

export const dataUtilsImportsProvider =
  createReadOnlyProviderType<DataUtilsImportsProvider>('data-utils-imports');

const prismaDataUtilsImportsTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_DATA_UTILS_PATHS.provider,
  },
  exports: { dataUtilsImports: dataUtilsImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        dataUtilsImports: createTsImportMap(dataUtilsImportsSchema, {
          AnyFieldDefinition: paths.types,
          AnyOperationHooks: paths.types,
          commitCreate: paths.commitOperations,
          commitDelete: paths.commitOperations,
          commitUpdate: paths.commitOperations,
          composeCreate: paths.composeOperations,
          composeUpdate: paths.composeOperations,
          createParentModelConfig: paths.fieldDefinitions,
          DataCreateInput: paths.types,
          DataDeleteInput: paths.types,
          DataOperationType: paths.types,
          DataUpdateInput: paths.types,
          FieldContext: paths.types,
          FieldDefinition: paths.types,
          FieldTransformData: paths.types,
          FieldTransformResult: paths.types,
          generateCreateSchema: paths.fieldUtils,
          generateUpdateSchema: paths.fieldUtils,
          GetPayload: paths.prismaTypes,
          InferFieldsOutput: paths.types,
          InferInput: paths.types,
          ModelPropName: paths.prismaTypes,
          ModelQuery: paths.prismaTypes,
          nestedOneToManyField: paths.fieldDefinitions,
          NestedOneToManyFieldConfig: paths.fieldDefinitions,
          nestedOneToOneField: paths.fieldDefinitions,
          NestedOneToOneFieldConfig: paths.fieldDefinitions,
          OperationContext: paths.types,
          OperationHooks: paths.types,
          ParentModelConfig: paths.fieldDefinitions,
          PrismaTransaction: paths.types,
          relationHelpers: paths.relationHelpers,
          scalarField: paths.fieldDefinitions,
          TransactionalOperationContext: paths.types,
          WhereUniqueInput: paths.prismaTypes,
        }),
      },
    };
  },
});

export const PRISMA_DATA_UTILS_IMPORTS = {
  task: prismaDataUtilsImportsTask,
};
