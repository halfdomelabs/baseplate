import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const logger = createTsTemplateFile({
  name: 'logger',
  projectExports: { logger: {} },
  source: { path: 'logger.ts' },
  variables: { TPL_LOGGER_OPTIONS: {} },
});

export const CORE_LOGGER_SERVICE_TS_TEMPLATES = { logger };
