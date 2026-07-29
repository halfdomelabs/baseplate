import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { pothosImportsProvider } from '#src/generators/pothos/pothos/generated/ts-import-providers.js';

const sortOrder = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main-group',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'sort-order',
  projectExports: {
    applyStableOrderBy: { isTypeOnly: false },
    sortOrderEnum: { isTypeOnly: false },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/sort-order.ts',
    ),
  },
  variables: {},
});

export const mainGroupGroup = { sortOrder };

export const POTHOS_POTHOS_SORT_ORDER_TEMPLATES = { mainGroupGroup };
