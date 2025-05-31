import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { authHooksImportsProvider } from '../../../auth/_providers/auth-hooks.js';
import { reactComponentsImportsProvider } from '../../../core/react-components/generated/ts-import-maps.js';

const adminLayout = createTsTemplateFile({
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'admin-layout',
  projectExports: {},
  source: { path: 'AdminLayout.tsx' },
  variables: { TPL_SIDEBAR_LINKS: {} },
});

export const ADMIN_ADMIN_LAYOUT_TS_TEMPLATES = { adminLayout };
