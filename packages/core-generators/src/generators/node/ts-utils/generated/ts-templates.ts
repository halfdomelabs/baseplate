import { createTsTemplateFile } from '#src/renderers/typescript/index.js';

const arrays = createTsTemplateFile({
  name: 'arrays',
  projectExports: { notEmpty: {} },
  source: { path: 'arrays.ts' },
  variables: {},
});

const normalizeTypes = createTsTemplateFile({
  name: 'normalize-types',
  projectExports: { NormalizeTypes: { isTypeOnly: true } },
  source: { path: 'normalize-types.ts' },
  variables: {},
});

const nulls = createTsTemplateFile({
  name: 'nulls',
  projectExports: { restrictObjectNulls: {} },
  source: { path: 'nulls.ts' },
  variables: {},
});

const string = createTsTemplateFile({
  name: 'string',
  projectExports: { capitalizeString: {} },
  source: { path: 'string.ts' },
  variables: {},
});

export const NODE_TS_UTILS_TS_TEMPLATES = {
  arrays,
  normalizeTypes,
  nulls,
  string,
};
