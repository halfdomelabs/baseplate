import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const adminLayout = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'admin-layout',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/AdminLayout/index.tsx',
    ),
  },
  variables: { TPL_SIDEBAR_LINKS: {} },
});

export const ADMIN_ADMIN_LAYOUT_TEMPLATES = { adminLayout };
