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
  AfterExecuteHook: { isTypeOnly: true },
  AnyBoundTransformer: { isTypeOnly: true },
  AnyTransformer: { isTypeOnly: true },
  BoundTransformer: { isTypeOnly: true },
  DataQuery: { isTypeOnly: true },
  defineTransformer: {},
  executeTransformPlan: {},
  GetResult: { isTypeOnly: true },
  InferTransformed: { isTypeOnly: true },
  MaybePromise: { isTypeOnly: true },
  ModelPropName: { isTypeOnly: true },
  oneToManyTransformer: {},
  oneToOneTransformer: {},
  prepareTransformers: {},
  relationHelpers: {},
  Transformer: { isTypeOnly: true },
  TransformerResult: { isTypeOnly: true },
  TransformPlan: { isTypeOnly: true },
  WhereInput: { isTypeOnly: true },
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
          AfterExecuteHook: paths.transformerTypes,
          AnyBoundTransformer: paths.transformerTypes,
          AnyTransformer: paths.transformerTypes,
          BoundTransformer: paths.transformerTypes,
          DataQuery: paths.prismaTypes,
          defineTransformer: paths.defineTransformer,
          executeTransformPlan: paths.executeTransformPlan,
          GetResult: paths.prismaTypes,
          InferTransformed: paths.transformerTypes,
          MaybePromise: paths.transformerTypes,
          ModelPropName: paths.prismaTypes,
          oneToManyTransformer: paths.nestedTransformers,
          oneToOneTransformer: paths.nestedTransformers,
          prepareTransformers: paths.prepareTransformers,
          relationHelpers: paths.relationHelpers,
          Transformer: paths.transformerTypes,
          TransformerResult: paths.transformerTypes,
          TransformPlan: paths.transformerTypes,
          WhereInput: paths.prismaTypes,
        }),
      },
    };
  },
});

export const PRISMA_DATA_UTILS_IMPORTS = {
  task: prismaDataUtilsImportsTask,
};
