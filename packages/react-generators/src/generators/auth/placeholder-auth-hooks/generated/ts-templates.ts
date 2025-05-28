import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@halfdomelabs/core-generators';

const useCurrentUser = createTsTemplateFile({
  group: 'hooks',
  importMapProviders: {},
  name: 'use-current-user',
  projectExports: { useCurrentUser: {} },
  source: { path: 'useCurrentUser.ts' },
  variables: {},
});

const useLogOut = createTsTemplateFile({
  group: 'hooks',
  importMapProviders: {},
  name: 'use-log-out',
  projectExports: { useLogOut: {} },
  source: { path: 'useLogOut.ts' },
  variables: {},
});

const useRequiredUserId = createTsTemplateFile({
  group: 'hooks',
  importMapProviders: {},
  name: 'use-required-user-id',
  projectExports: { useRequiredUserId: {} },
  source: { path: 'useRequiredUserId.ts' },
  variables: {},
});

const useSession = createTsTemplateFile({
  group: 'hooks',
  importMapProviders: {},
  name: 'use-session',
  projectExports: { useSession: {} },
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

export const AUTH_PLACEHOLDER_AUTH_HOOKS_TS_TEMPLATES = { hooksGroup };