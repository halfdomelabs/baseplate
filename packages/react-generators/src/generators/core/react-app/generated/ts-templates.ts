import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const app = createTsTemplateFile({
  name: 'app',
  projectExports: {},
  source: { path: 'App.tsx' },
  variables: { TPL_RENDER_ROOT: {} },
});

export const CORE_REACT_APP_TS_TEMPLATES = { app };
