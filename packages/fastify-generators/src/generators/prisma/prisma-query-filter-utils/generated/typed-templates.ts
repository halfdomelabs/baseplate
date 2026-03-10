import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authRolesImportsProvider } from '#src/generators/auth/auth-roles/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { dataUtilsImportsProvider } from '#src/generators/prisma/data-utils/generated/ts-import-providers.js';

const utilsQueryFilters = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main-group',
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    dataUtilsImports: dataUtilsImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'utils-query-filters',
  projectExports: {
    createModelQueryFilter: { isTypeOnly: false },
    ModelQueryFilter: { isTypeOnly: true },
    ModelQueryFilterConfig: { isTypeOnly: true },
    QueryFilterBuildWhereOptions: { isTypeOnly: true },
    QueryFilterRole: { isTypeOnly: true },
  },
  referencedGeneratorTemplates: { utilsQueryHelpers: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/query-filters.ts',
    ),
  },
  variables: {},
});

const utilsQueryHelpers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main-group',
  importMapProviders: { dataUtilsImports: dataUtilsImportsProvider },
  name: 'utils-query-helpers',
  projectExports: {
    queryHelpers: { isTypeOnly: false },
    WhereResult: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/query-helpers.ts',
    ),
  },
  variables: {},
});

export const mainGroupGroup = { utilsQueryFilters, utilsQueryHelpers };

export const PRISMA_PRISMA_QUERY_FILTER_UTILS_TEMPLATES = { mainGroupGroup };
