import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { prismaGeneratedImportsProvider } from '#src/generators/prisma/_providers/prisma-generated-imports.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/generated/ts-import-providers.js';

const defineOperations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'define-operations',
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

const index = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'data-operations',
  importMapProviders: {},
  name: 'index',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/data-operations/index.ts',
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
  index,
  prismaTypes,
  prismaUtils,
  relationHelpers,
  types,
};

export const PRISMA_DATA_UTILS_TEMPLATES = { dataOperationsGroup };
