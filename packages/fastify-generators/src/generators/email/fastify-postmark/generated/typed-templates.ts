import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

const postmark = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'postmark',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/postmark.ts',
    ),
  },
  variables: { TPL_DEFAULT_FROM: {}, TPL_TEMPLATE_CONFIG: {} },
});

export const EMAIL_FASTIFY_POSTMARK_TEMPLATES = { postmark };
