import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { userSessionTypesImportsProvider } from '../../user-session-types/index.js';

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
