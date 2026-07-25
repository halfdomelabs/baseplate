import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { pothosImportsProvider } from '#src/generators/pothos/pothos/generated/ts-import-providers.js';

const filters = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main-group',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'filters',
  projectExports: { validateWhereComplexity: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/filters.ts',
    ),
  },
  variables: {},
});

export const mainGroupGroup = { filters };

export const POTHOS_POTHOS_PRISMA_FILTERS_FILE_TEMPLATES = { mainGroupGroup };
