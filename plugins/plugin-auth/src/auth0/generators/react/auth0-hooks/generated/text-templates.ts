import { createTextTemplateFile } from '@baseplate-dev/sync';

const useCurrentUserGql = createTextTemplateFile({
  name: 'use-current-user-gql',
  source: { path: 'useCurrentUser.gql' },
  variables: {
    TPL_USER_QUERY_NAME: { description: 'The name of the user query' },
  },
});

export const AUTH_0_AUTH_0_HOOKS_TEXT_TEMPLATES = {
  useCurrentUserGql,
};
