import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { authHooksImportsProvider } from '../../../auth/_providers/auth-hooks.js';
import { reactComponentsImportsProvider } from '../../../core/react-components/index.js';

const home = createTsTemplateFile({
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'home',
  projectExports: {},
  source: { path: 'Home.page.tsx' },
  variables: {},
});

export const ADMIN_ADMIN_HOME_TS_TEMPLATES = { home };
