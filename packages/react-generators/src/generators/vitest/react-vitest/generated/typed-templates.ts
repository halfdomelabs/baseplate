import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const setup = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'setup',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/tests/setup.ts'),
  },
  variables: {},
});

export const VITEST_REACT_VITEST_TEMPLATES = { setup };
