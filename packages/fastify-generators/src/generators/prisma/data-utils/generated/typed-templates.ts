import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { prismaGeneratedImportsProvider } from '#src/generators/prisma/_providers/prisma-generated-imports.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/generated/ts-import-providers.js';

const defineTransformer = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'define-transformer',
  projectExports: { defineTransformer: { isTypeOnly: false } },
  referencedGeneratorTemplates: { transformerTypes: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/define-transformer.ts',
    ),
  },
  variables: {},
});

const executeTransformPlan = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'execute-transform-plan',
  projectExports: { executeTransformPlan: { isTypeOnly: false } },
  referencedGeneratorTemplates: { transformerTypes: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/execute-transform-plan.ts',
    ),
  },
  variables: {},
});

const nestedTransformers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'nested-transformers',
  projectExports: {
    oneToManyTransformer: { isTypeOnly: false },
    oneToOneTransformer: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { prismaTypes: {}, transformerTypes: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/nested-transformers.ts',
    ),
  },
  variables: {},
});

const prepareTransformers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'prepare-transformers',
  projectExports: { prepareTransformers: { isTypeOnly: false } },
  referencedGeneratorTemplates: { transformerTypes: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/prepare-transformers.ts',
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
    DataQuery: { isTypeOnly: true },
    GetResult: { isTypeOnly: true },
    ModelPropName: { isTypeOnly: true },
    WhereInput: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/prisma-types.ts',
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

const transformerTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'transformer-types',
  projectExports: {
    AfterExecuteHook: { isTypeOnly: true },
    AnyBoundTransformer: { isTypeOnly: true },
    AnyTransformer: { isTypeOnly: true },
    BoundTransformer: { isTypeOnly: true },
    InferTransformed: { isTypeOnly: true },
    InferUnresolvedTransformed: { isTypeOnly: true },
    MaybePromise: { isTypeOnly: true },
    Transformer: { isTypeOnly: true },
    TransformerResult: { isTypeOnly: true },
    TransformPlan: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/transformer-types.ts',
    ),
  },
  variables: {},
});

export const dataOperationsGroup = {
  defineTransformer,
  executeTransformPlan,
  nestedTransformers,
  prepareTransformers,
  prismaTypes,
  relationHelpers,
  transformerTypes,
};

export const PRISMA_DATA_UTILS_TEMPLATES = { dataOperationsGroup };
