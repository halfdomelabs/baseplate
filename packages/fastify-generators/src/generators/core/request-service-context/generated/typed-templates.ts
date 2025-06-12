import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';

const requestServiceContext = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'request-service-context',
  projectExports: {
    RequestServiceContext: { isTypeOnly: true },
    createContextFromRequest: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/request-service-context.ts',
    ),
  },
  variables: {
    TPL_CONTEXT_BODY: {},
    TPL_CONTEXT_CREATOR: {},
    TPL_CONTEXT_FIELDS: {},
  },
});

export const CORE_REQUEST_SERVICE_CONTEXT_TEMPLATES = { requestServiceContext };
