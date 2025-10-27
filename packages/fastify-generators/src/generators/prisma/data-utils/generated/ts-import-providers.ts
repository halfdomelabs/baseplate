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

const dataUtilsImportsSchema = createTsImportMapSchema({
  AnyFieldDefinition: { isTypeOnly: true },
  AnyOperationHooks: { isTypeOnly: true },
  createParentModelConfig: {},
  DataOperationType: { isTypeOnly: true },
  FieldContext: { isTypeOnly: true },
  FieldDefinition: { isTypeOnly: true },
  FieldTransformData: { isTypeOnly: true },
  FieldTransformResult: { isTypeOnly: true },
  InferFieldsOutput: { isTypeOnly: true },
  InferInput: { isTypeOnly: true },
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
          createParentModelConfig: paths.fieldDefinitions,
          DataOperationType: paths.types,
          FieldContext: paths.types,
          FieldDefinition: paths.types,
          FieldTransformData: paths.types,
          FieldTransformResult: paths.types,
          InferFieldsOutput: paths.types,
          InferInput: paths.types,
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
        }),
      },
    };
  },
});

export const PRISMA_DATA_UTILS_IMPORTS = {
  task: prismaDataUtilsImportsTask,
};
