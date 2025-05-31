import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { reactComponentsImportsProvider } from '../../react-components/generated/ts-import-maps.js';
import { reactErrorImportsProvider } from '../../react-error/generated/ts-import-maps.js';

const component = createTsTemplateFile({
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'component',
  projectExports: {},
  source: { path: 'error-boundary.tsx' },
  variables: {},
});

export const CORE_REACT_ERROR_BOUNDARY_TS_TEMPLATES = { component };
