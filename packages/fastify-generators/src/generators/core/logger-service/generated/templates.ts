import { tsCodeFileTemplate } from '@halfdomelabs/core-generators';

export const loggerFileTemplate = tsCodeFileTemplate({
  name: 'logger',
  source: {
    path: 'logger.ts',
  },
  variables: {
    TPL_LOGGER_OPTIONS: {},
  },
});
