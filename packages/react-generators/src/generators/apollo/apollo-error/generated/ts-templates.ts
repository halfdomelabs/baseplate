import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const apolloError = createTsTemplateFile({
  name: 'apollo-error',
  projectExports: { getApolloErrorCode: {} },
  source: { path: 'apollo-error.ts' },
  variables: {},
});

export const APOLLO_APOLLO_ERROR_TS_TEMPLATES = { apolloError };
