import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { configServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { emailModuleImportsProvider } from '#src/email/core/generators/email-module/generated/ts-import-providers.js';

const postmarkAdapter = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    emailModuleImports: emailModuleImportsProvider,
  },
  name: 'postmark-adapter',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/postmark.adapter.ts',
    ),
  },
  variables: {},
});

export const POSTMARK_CORE_POSTMARK_TEMPLATES = { postmarkAdapter };
