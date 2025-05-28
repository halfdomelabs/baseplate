import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { userSessionTypesImportsProvider } from '../../user-session-types/user-session-types.generator.js';

const userSessionService = createTsTemplateFile({
  importMapProviders: {
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  name: 'user-session-service',
  projectExports: { userSessionService: {} },
  source: { path: 'user-session.service.ts' },
  variables: {},
});

export const AUTH_PLACEHOLDER_AUTH_SERVICE_TS_TEMPLATES = {
  userSessionService,
};
