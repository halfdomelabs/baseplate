import { createTextTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const readme = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'readme',
  source: {
    path: path.join(import.meta.dirname, '../templates/package/README.md'),
  },
  variables: { TPL_PROJECT: { description: 'Name of the project' } },
});

export const CORE_README_TEMPLATES = { readme };
