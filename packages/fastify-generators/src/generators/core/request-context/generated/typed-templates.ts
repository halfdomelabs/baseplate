import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { appRuntimeImportsProvider } from '#src/generators/core/app-runtime/generated/ts-import-providers.js';

const requestContext = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { appRuntimeImports: appRuntimeImportsProvider },
  name: 'request-context',
  projectExports: { RequestInfo: { isTypeOnly: true } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/request-context.ts',
    ),
  },
  variables: {
    TPL_DECORATOR_REGISTRATIONS: {},
    TPL_EXTRA_HOOKS: {},
    TPL_FASTIFY_REQUEST_AUGMENTATIONS: {},
  },
});

export const CORE_REQUEST_CONTEXT_TEMPLATES = { requestContext };
