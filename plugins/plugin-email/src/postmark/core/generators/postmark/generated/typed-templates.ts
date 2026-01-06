import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { configServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { emailModuleImportsProvider } from '#src/email/core/generators/email-module/generated/ts-import-providers.js';

const postmarkService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    emailModuleImports: emailModuleImportsProvider,
  },
  name: 'postmark-service',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/emails/services/postmark.service.ts',
    ),
  },
  variables: {},
});

export const POSTMARK_POSTMARK_TEMPLATES = { postmarkService };
