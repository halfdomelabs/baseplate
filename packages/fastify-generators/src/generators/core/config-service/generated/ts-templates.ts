import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const config = createTsTemplateFile({
  name: 'config',
  source: { path: 'config.ts' },
  variables: { TPL_CONFIG_SCHEMA: {}, TPL_ADDITIONAL_VERIFICATIONS: {} },
});

export const CORE_CONFIG_SERVICE_TS_TEMPLATES = {
  config,
};
