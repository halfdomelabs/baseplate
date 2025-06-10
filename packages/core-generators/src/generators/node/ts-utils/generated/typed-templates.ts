import path from 'node:path';

import { createTsTemplateFile } from '#src/renderers/typescript/templates/types.js';

const arrays = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'arrays',
  projectExports: { notEmpty: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/utils/arrays.ts'),
  },
  variables: {},
});
const normalizeTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'normalize-types',
  projectExports: { NormalizeTypes: { isTypeOnly: true } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/normalize-types.ts',
    ),
  },
  variables: {},
});
const nulls = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'nulls',
  projectExports: { restrictObjectNulls: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/utils/nulls.ts'),
  },
  variables: {},
});
const string = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'string',
  projectExports: { capitalizeString: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/utils/string.ts'),
  },
  variables: {},
});

export const NODE_TS_UTILS_TEMPLATES = {
  arrays,
  normalizeTypes,
  nulls,
  string,
};
