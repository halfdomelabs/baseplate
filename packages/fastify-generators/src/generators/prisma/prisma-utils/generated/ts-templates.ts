import {
  createTsTemplateFile,
  createTsTemplateGroup,
  tsUtilsImportsProvider,
} from '@baseplate-dev/core-generators';

import { serviceContextImportsProvider } from '../../../core/service-context/generated/ts-import-maps.js';
import { prismaImportsProvider } from '../../prisma/generated/ts-import-maps.js';

const crudServiceTypes = createTsTemplateFile({
  group: 'utils',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'crud-service-types',
  projectExports: {
    CreateServiceInput: { isTypeOnly: true },
    DeleteServiceInput: { isTypeOnly: true },
    UpdateServiceInput: { isTypeOnly: true },
  },
  source: { path: 'crud-service-types.ts' },
  variables: {},
});

const dataPipes = createTsTemplateFile({
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
  source: { path: 'data-pipes.ts' },
  variables: {},
});

const embeddedOneToMany = createTsTemplateFile({
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
  source: { path: 'embedded-pipes/embedded-one-to-many.ts' },
  variables: {},
});

const embeddedOneToOne = createTsTemplateFile({
  group: 'utils',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'embedded-one-to-one',
  projectExports: {
    createOneToOneCreateData: {},
    createOneToOneUpsertData: {},
  },
  source: { path: 'embedded-pipes/embedded-one-to-one.ts' },
  variables: {},
});

const embeddedTypes = createTsTemplateFile({
  group: 'utils',
  name: 'embedded-types',
  projectExports: { UpsertPayload: { isTypeOnly: true } },
  source: { path: 'embedded-pipes/embedded-types.ts' },
  variables: {},
});

const prismaRelations = createTsTemplateFile({
  group: 'utils',
  name: 'prisma-relations',
  projectExports: { createPrismaDisconnectOrConnectData: {} },
  source: { path: 'prisma-relations.ts' },
  variables: {},
});

const utilsGroup = createTsTemplateGroup({
  templates: {
    crudServiceTypes: {
      destination: 'crud-service-types.ts',
      template: crudServiceTypes,
    },
    dataPipes: { destination: 'data-pipes.ts', template: dataPipes },
    embeddedOneToMany: {
      destination: 'embedded-pipes/embedded-one-to-many.ts',
      template: embeddedOneToMany,
    },
    embeddedOneToOne: {
      destination: 'embedded-pipes/embedded-one-to-one.ts',
      template: embeddedOneToOne,
    },
    embeddedTypes: {
      destination: 'embedded-pipes/embedded-types.ts',
      template: embeddedTypes,
    },
    prismaRelations: {
      destination: 'prisma-relations.ts',
      template: prismaRelations,
    },
  },
});

export const PRISMA_PRISMA_UTILS_TS_TEMPLATES = { utilsGroup };
