import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';

const useCurrentUser = createTsTemplateFile({
  group: 'hooks',
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
  },
  name: 'use-current-user',
  projectExports: { useCurrentUser: {} },
  source: { path: 'useCurrentUser.ts' },
  variables: { TPL_USER: {} },
});

const useLogOut = createTsTemplateFile({
  group: 'hooks',
  importMapProviders: { reactErrorImports: reactErrorImportsProvider },
  name: 'use-log-out',
  projectExports: { useLogOut: {} },
  source: { path: 'useLogOut.ts' },
  variables: {},
});

const useRequiredUserId = createTsTemplateFile({
  group: 'hooks',
  name: 'use-required-user-id',
  projectExports: { useRequiredUserId: {} },
  source: { path: 'useRequiredUserId.ts' },
  variables: {},
});

const useSession = createTsTemplateFile({
  group: 'hooks',
  name: 'use-session',
  projectExports: { SessionData: { isTypeOnly: true }, useSession: {} },
  source: { path: 'useSession.ts' },
  variables: {},
});

const hooksGroup = createTsTemplateGroup({
  templates: {
    useCurrentUser: {
      destination: 'useCurrentUser.ts',
      template: useCurrentUser,
    },
    useLogOut: { destination: 'useLogOut.ts', template: useLogOut },
    useRequiredUserId: {
      destination: 'useRequiredUserId.ts',
      template: useRequiredUserId,
    },
    useSession: { destination: 'useSession.ts', template: useSession },
  },
});

export const AUTH_0_AUTH_0_HOOKS_TS_TEMPLATES = { hooksGroup };
