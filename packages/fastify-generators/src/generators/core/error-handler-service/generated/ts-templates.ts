import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const errorHandlerPlugin = createTsTemplateFile({
  name: 'error-handler-plugin',
  source: { path: 'plugins/error-handler.ts' },
  variables: {},
});

export const CORE_ERROR_HANDLER_SERVICE_TS_TEMPLATES = {
  errorHandlerPlugin,
};
