import path from 'node:path';

import { createTextTemplateFile } from '#src/renderers/text/types.js';

const readme = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'readme',
  source: {
    path: path.join(import.meta.dirname, '../templates/package/README.md'),
  },
  variables: { TPL_PROJECT: { description: 'Name of the project' } },
});

export const NODE_ROOT_README_TEMPLATES = { readme };
