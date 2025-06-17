import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const logger = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'logger',
  projectExports: { logger: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/logger.ts'),
  },
  variables: {},
});

export const CORE_REACT_LOGGER_TEMPLATES = { logger };
