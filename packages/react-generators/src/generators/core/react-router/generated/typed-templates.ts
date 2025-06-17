import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const index = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'index',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/pages/index.tsx'),
  },
  variables: { TPL_RENDER_HEADER: {}, TPL_ROUTES: {} },
});

export const CORE_REACT_ROUTER_TEMPLATES = { index };
