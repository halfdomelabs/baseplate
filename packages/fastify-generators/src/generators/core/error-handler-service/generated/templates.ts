import { tsCodeFileTemplate } from '@halfdomelabs/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '../../config-service/index.js';

export const errorHandlerPluginFileTemplate = tsCodeFileTemplate({
  name: 'error-handler-plugin',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/plugins/error-handler.ts',
    ),
  },
  variables: {},
  importMapProviders: {
    configService: configServiceImportsProvider,
  },
});
