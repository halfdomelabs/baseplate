import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { serviceContextImportsProvider } from '../../service-context/generated/ts-import-maps.js';

const requestServiceContext = createTsTemplateFile({
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'request-service-context',
  projectExports: {
    RequestServiceContext: { isTypeOnly: true },
    createContextFromRequest: {},
  },
  source: { path: 'request-service-context.ts' },
  variables: {
    TPL_CONTEXT_BODY: {},
    TPL_CONTEXT_CREATOR: {},
    TPL_CONTEXT_FIELDS: {},
  },
});

export const CORE_REQUEST_SERVICE_CONTEXT_TS_TEMPLATES = {
  requestServiceContext,
};
