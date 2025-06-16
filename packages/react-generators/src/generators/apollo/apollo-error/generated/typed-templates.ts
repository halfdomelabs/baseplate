import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const apolloError = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'apollo-error',
  projectExports: { getApolloErrorCode: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/apollo-error.ts',
    ),
  },
  variables: {},
});

export const APOLLO_APOLLO_ERROR_TEMPLATES = { apolloError };
