import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const home = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'home',
  source: {
    path: path.join(import.meta.dirname, '../templates/routes/index.tsx'),
  },
  variables: { TPL_ROUTE_PATH: {} },
});

const rootIndex = createTsTemplateFile({
  fileOptions: { generatorTemplatePath: 'root-index.tsx', kind: 'instance' },
  importMapProviders: {},
  name: 'root-index',
  source: {
    path: path.join(import.meta.dirname, '../templates/root-index.tsx'),
  },
  variables: {},
});

export const ADMIN_ADMIN_HOME_TEMPLATES = { rootIndex, home };
