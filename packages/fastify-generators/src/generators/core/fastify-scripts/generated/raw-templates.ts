import { createRawTemplateFile } from '@baseplate-dev/sync';

const tsconfig = createRawTemplateFile({
  name: 'tsconfig',
  source: { path: 'tsconfig.tpl.json' },
});

export const CORE_FASTIFY_SCRIPTS_RAW_TEMPLATES = {
  tsconfig,
};
