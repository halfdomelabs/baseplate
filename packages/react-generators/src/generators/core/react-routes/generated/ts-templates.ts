import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const index = createTsTemplateFile({
  name: 'index',
  projectExports: {},
  source: { path: 'routes.tsx' },
  variables: { TPL_ROUTES: {}, TPL_ROUTES_NAME: {}, TPL_ROUTE_HEADER: {} },
});

export const CORE_REACT_ROUTES_TS_TEMPLATES = { index };
