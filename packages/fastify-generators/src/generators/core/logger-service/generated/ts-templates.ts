import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const logger = createTsTemplateFile({
  name: 'logger',
  projectExports: { logger: {} },
  source: { path: 'logger.ts' },
  variables: { TPL_LOGGER_OPTIONS: {} },
  fileOptions: { kind: 'singleton' },
});

export const CORE_LOGGER_SERVICE_TS_TEMPLATES = { logger };
