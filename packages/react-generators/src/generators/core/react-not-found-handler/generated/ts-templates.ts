import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { reactComponentsImportsProvider } from '../../react-components/index.js';

const notFoundPage = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'not-found-page',
  projectExports: {},
  source: { path: 'NotFound.page.tsx' },
  variables: {},
});

export const CORE_REACT_NOT_FOUND_HANDLER_TS_TEMPLATES = { notFoundPage };
