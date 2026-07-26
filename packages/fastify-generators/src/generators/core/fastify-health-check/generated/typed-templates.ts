import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { appRuntimeImportsProvider } from '#src/generators/core/app-runtime/generated/ts-import-providers.js';

const healthCheck = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { appRuntimeImports: appRuntimeImportsProvider },
  name: 'health-check',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/health-check.ts',
    ),
  },
  variables: {
    TPL_HEALTH_CHECKS: {},
    TPL_PLUGIN_PARAMS: {},
    TPL_SERVICES_FIELD: {},
  },
});

export const CORE_FASTIFY_HEALTH_CHECK_TEMPLATES = { healthCheck };
