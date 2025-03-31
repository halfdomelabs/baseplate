import { tsCodeFileTemplate } from '@halfdomelabs/core-generators';
import path from 'node:path';

export const loggerFileTemplate = tsCodeFileTemplate({
  name: 'logger',
  source: {
    path: path.join(import.meta.dirname, '../templates/logger.ts'),
  },
  variables: {
    TPL_LOGGER_OPTIONS: {},
  },
});
