import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const config = createTsTemplateFile({
  name: 'config',
  projectExports: { config: {} },
  source: { path: 'config.ts' },
  variables: { TPL_ADDITIONAL_VERIFICATIONS: {}, TPL_CONFIG_SCHEMA: {} },
});

export const CORE_CONFIG_SERVICE_TS_TEMPLATES = { config };
