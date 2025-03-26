import { tsCodeFileTemplate } from '@halfdomelabs/core-generators';
import path from 'node:path';

export const loggerFileTemplate = tsCodeFileTemplate({
  name: 'logger',
  path: path.join(import.meta.dirname, '../templates/logger.ts'),
  variables: {
    LOGGER_OPTIONS: {},
  },
});
