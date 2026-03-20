import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { configServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { emailModuleImportsProvider } from '#src/email/core/generators/email-module/generated/ts-import-providers.js';

const resendService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    emailModuleImports: emailModuleImportsProvider,
  },
  name: 'resend-service',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/emails/services/resend.service.ts',
    ),
  },
  variables: {},
});

export const RESEND_CORE_RESEND_TEMPLATES = { resendService };
