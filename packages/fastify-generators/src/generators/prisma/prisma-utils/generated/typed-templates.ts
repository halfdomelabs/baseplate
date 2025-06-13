import {
  createTsTemplateFile,
  tsUtilsImportsProvider,
} from '@baseplate-dev/core-generators';
import path from 'node:path';

import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/generated/ts-import-providers.js';

const crudServiceTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'crud-service-types',
  projectExports: {
    CreateServiceInput: { isTypeOnly: true },
    DeleteServiceInput: { isTypeOnly: true },
    UpdateServiceInput: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/crud-service-types.ts',
    ),
  },
  variables: {},
});

const dataPipes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {
    prismaImports: prismaImportsProvider,
    tsUtilsImports: tsUtilsImportsProvider,
  },
  name: 'data-pipes',
  projectExports: {
    DataPipeOutput: { isTypeOnly: true },
    applyDataPipeOutput: {},
    applyDataPipeOutputToOperations: {},
    applyDataPipeOutputWithoutOperation: {},
    mergePipeOperations: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-pipes.ts',
    ),
  },
  variables: {},
});

const embeddedOneToMany = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {
    serviceContextImports: serviceContextImportsProvider,
    tsUtilsImports: tsUtilsImportsProvider,
  },
  name: 'embedded-one-to-many',
  projectExports: {
    createOneToManyCreateData: {},
    createOneToManyUpsertData: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/embedded-pipes/embedded-one-to-many.ts',
    ),
  },
  variables: {},
});

const embeddedOneToOne = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'embedded-one-to-one',
  projectExports: {
    createOneToOneCreateData: {},
    createOneToOneUpsertData: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/embedded-pipes/embedded-one-to-one.ts',
    ),
  },
  variables: {},
});

const embeddedTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'embedded-types',
  projectExports: { UpsertPayload: { isTypeOnly: true } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/embedded-pipes/embedded-types.ts',
    ),
  },
  variables: {},
});

const prismaRelations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'prisma-relations',
  projectExports: { createPrismaDisconnectOrConnectData: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/prisma-relations.ts',
    ),
  },
  variables: {},
});

export const utilsGroup = {
  crudServiceTypes,
  dataPipes,
  embeddedOneToMany,
  embeddedOneToOne,
  embeddedTypes,
  prismaRelations,
};

export const PRISMA_PRISMA_UTILS_TEMPLATES = { utilsGroup };
