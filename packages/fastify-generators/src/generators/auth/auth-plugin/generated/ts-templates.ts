import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { userSessionServiceImportsProvider } from '../../_providers/user-session.js';
import { authContextImportsProvider } from '../../auth-context/generated/ts-import-maps.js';
import { userSessionTypesImportsProvider } from '../../user-session-types/generated/ts-import-maps.js';

const authPlugin = createTsTemplateFile({
  importMapProviders: {
    authContextImports: authContextImportsProvider,
    userSessionServiceImports: userSessionServiceImportsProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  name: 'auth-plugin',
  projectExports: {},
  source: { path: 'auth.plugin.ts' },
  variables: {},
});

export const AUTH_AUTH_PLUGIN_TS_TEMPLATES = { authPlugin };
