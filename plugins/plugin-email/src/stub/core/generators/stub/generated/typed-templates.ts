import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { loggerServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { emailModuleImportsProvider } from '#src/email/core/generators/email-module/generated/ts-import-providers.js';

const stubService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    emailModuleImports: emailModuleImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'stub-service',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/emails/services/stub.service.ts',
    ),
  },
  variables: {
    TPL_ADAPTER_NAME: {},
    TPL_LOG_MESSAGE: {},
    TPL_PROVIDER_NAME: {},
  },
});

export const STUB_CORE_STUB_TEMPLATES = { stubService };
