import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const appApolloProvider = createTsTemplateFile({
  name: 'app-apollo-provider',
  projectExports: {},
  source: { path: 'app/AppApolloProvider.tsx' },
  variables: {
    TPL_CREATE_ARGS: {},
    TPL_MEMO_DEPENDENCIES: {},
    TPL_RENDER_BODY: {},
  },
});

const cache = createTsTemplateFile({
  name: 'cache',
  projectExports: { createApolloCache: {} },
  source: { path: 'services/apollo/cache.ts' },
  variables: {},
});

const service = createTsTemplateFile({
  name: 'service',
  projectExports: { createApolloClient: {} },
  source: { path: 'services/apollo/index.ts' },
  variables: { TPL_CREATE_ARGS: {}, TPL_LINKS: {}, TPL_LINK_BODIES: {} },
});

export const APOLLO_REACT_APOLLO_TS_TEMPLATES = {
  appApolloProvider,
  cache,
  service,
};
