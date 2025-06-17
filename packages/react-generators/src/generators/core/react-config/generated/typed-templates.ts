import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const config = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'config',
  projectExports: { config: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/config.ts'),
  },
  variables: { TPL_CONFIG_SCHEMA: {} },
});

export const CORE_REACT_CONFIG_TEMPLATES = { config };
