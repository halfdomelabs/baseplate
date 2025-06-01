import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const logger = createTsTemplateFile({
  name: 'logger',
  projectExports: { logger: {} },
  source: { path: 'logger.ts' },
  variables: {},
});

export const CORE_REACT_LOGGER_TS_TEMPLATES = { logger };
