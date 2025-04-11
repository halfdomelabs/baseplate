import { createRawTemplateFile } from '@halfdomelabs/sync';

const TsconfigRawTemplate = createRawTemplateFile({
  name: 'tsconfig',
  source: { path: 'tsconfig.tpl.json' },
});

export const CORE_FASTIFY_SCRIPTS_RAW_TEMPLATES = {
  TsconfigRawTemplate,
};
