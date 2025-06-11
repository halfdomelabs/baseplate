import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const config = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'config',
  projectExports: { config: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/config.ts'),
  },
  variables: { TPL_CONFIG_SCHEMA: {} },
});

export const CORE_CONFIG_SERVICE_TEMPLATES = { config };
