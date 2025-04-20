import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const index = createTsTemplateFile({
  name: 'index',
  projectExports: { PagesRoot: {} },
  source: { path: 'index.tsx' },
  variables: { TPL_RENDER_HEADER: {}, TPL_ROUTES: {} },
});

export const CORE_REACT_ROUTER_TS_TEMPLATES = { index };
