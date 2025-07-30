import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactUtilsImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const userSessionCheck = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
  },
  name: 'user-session-check',
  referencedGeneratorTemplates: { useUserSessionClient: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/user-session-check.tsx',
    ),
  },
  variables: {},
});

const userSessionClient = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { reactUtilsImports: reactUtilsImportsProvider },
  name: 'user-session-client',
  projectExports: {
    createUserSessionClient: {},
    SessionChangeCallback: { isTypeOnly: true },
    UserSessionClient: {},
    UserSessionClientConfig: { isTypeOnly: true },
    UserSessionData: { isTypeOnly: true },
  },
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
  importMapProviders: {},
  name: 'user-session-provider',
  referencedGeneratorTemplates: {
    useUserSessionClient: {},
    userSessionClient: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/user-session-provider.tsx',
    ),
  },
  variables: {},
});

const useUserSessionClient = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'use-user-session-client',
  projectExports: {
    UserSessionClientContext: {},
    UserSessionClientContextValue: { isTypeOnly: true },
    useUserSessionClient: {},
  },
  referencedGeneratorTemplates: { userSessionClient: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-user-session-client.ts',
    ),
  },
  variables: {},
});

export const mainGroup = {
  userSessionCheck,
  userSessionClient,
  userSessionProvider,
  useUserSessionClient,
};

const userSessionCheckGql = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'user-session-check-gql',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/user-session-check.gql',
    ),
  },
  variables: {},
});

export const LOCAL_AUTH_CORE_REACT_SESSION_TEMPLATES = {
  mainGroup,
  userSessionCheckGql,
};
