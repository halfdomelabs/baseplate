import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  generatedGraphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
  reactUtilsImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

import { localAuthHooksImportsProvider } from '#src/local-auth/core/generators/auth-hooks/generated/ts-import-providers.js';

const userSessionClient = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { reactUtilsImports: reactUtilsImportsProvider },
  name: 'user-session-client',
  projectExports: { userSessionClient: {}, UserSessionClient: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/user-session-client.ts',
    ),
  },
  variables: {},
});

const userSessionProvider = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    localAuthHooksImports: localAuthHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'user-session-provider',
  referencedGeneratorTemplates: { userSessionClient: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/user-session-provider.tsx',
    ),
  },
  variables: {},
});

export const mainGroup = { userSessionClient, userSessionProvider };

const userSessionProviderGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'user-session-provider-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/user-session-provider.gql',
    ),
  },
  variables: {},
});

export const LOCAL_AUTH_CORE_REACT_SESSION_TEMPLATES = {
  mainGroup,
  userSessionProviderGql,
};
