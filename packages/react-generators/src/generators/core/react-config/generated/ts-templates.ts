import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const config = createTsTemplateFile({
  name: 'config',
  projectExports: { config: {} },
  source: { path: 'config.ts' },
  variables: { TPL_CONFIG_SCHEMA: {} },
});

export const CORE_REACT_CONFIG_TS_TEMPLATES = { config };
