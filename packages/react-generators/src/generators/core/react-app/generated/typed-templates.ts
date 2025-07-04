import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const app = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'app',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/app/app.tsx'),
  },
  variables: { TPL_RENDER_ROOT: {} },
});

export const CORE_REACT_APP_TEMPLATES = { app };
