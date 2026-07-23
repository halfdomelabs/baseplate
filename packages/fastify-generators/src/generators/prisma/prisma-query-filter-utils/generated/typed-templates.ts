import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { dataUtilsImportsProvider } from '#src/generators/prisma/data-utils/generated/ts-import-providers.js';

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

export const mainGroupGroup = { utilsQueryHelpers };

export const PRISMA_PRISMA_QUERY_FILTER_UTILS_TEMPLATES = { mainGroupGroup };
