import { createRawTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const tsconfig = createRawTemplateFile({
  name: 'tsconfig',
  source: {
    path: path.join(import.meta.dirname, '../templates/tsconfig.tpl.json'),
  },
  fileOptions: {
    kind: 'singleton',
    generatorTemplatePath: 'tsconfig.tpl.json',
  },
});

export const CORE_FASTIFY_SCRIPTS_TEMPLATES = { tsconfig };
