import { tsCodeFileTemplate } from '@halfdomelabs/core-generators';

import { configServiceImportsProvider } from '../../config-service/index.js';

export const errorHandlerPluginFileTemplate = tsCodeFileTemplate({
  name: 'error-handler-plugin',
  source: {
    path: 'plugins/error-handler.ts',
  },
  variables: {},
  importMapProviders: {
    configService: configServiceImportsProvider,
  },
});
