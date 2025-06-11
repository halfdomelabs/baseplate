import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { configServiceImportsProvider } from '../../../core/config-service/generated/ts-import-providers.js';

const postmark = createTsTemplateFile({
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'postmark',
  projectExports: {},
  source: { path: 'postmark.ts' },
  variables: { TPL_DEFAULT_FROM: {}, TPL_TEMPLATE_CONFIG: {} },
});

export const EMAIL_FASTIFY_POSTMARK_TS_TEMPLATES = { postmark };
