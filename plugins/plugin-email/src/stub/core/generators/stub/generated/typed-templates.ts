import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { loggerServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { emailModuleImportsProvider } from '#src/email/core/generators/email-module/generated/ts-import-providers.js';

const stubAdapter = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    emailModuleImports: emailModuleImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'stub-adapter',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/stub.adapter.ts',
    ),
  },
  variables: {
    TPL_ADAPTER_NAME: {},
    TPL_LOG_MESSAGE: {},
    TPL_PROVIDER_NAME: {},
  },
});

export const STUB_CORE_STUB_TEMPLATES = { stubAdapter };
