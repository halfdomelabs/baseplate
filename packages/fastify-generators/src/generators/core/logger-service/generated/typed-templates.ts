import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const logger = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'logger',
  projectExports: { logger: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/logger.ts'),
  },
  variables: { TPL_LOGGER_OPTIONS: {} },
});

export const CORE_LOGGER_SERVICE_TEMPLATES = { logger };
