import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const appApolloProvider = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'app-apollo-provider',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/app-apollo-provider.tsx',
    ),
  },
  variables: {
    TPL_CREATE_ARGS: {},
    TPL_MEMO_DEPENDENCIES: {},
    TPL_RENDER_BODY: {},
  },
});

const cache = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'cache',
  projectExports: { createApolloCache: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/apollo/cache.ts',
    ),
  },
  variables: {},
});

const codegenConfig = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'codegen-config',
  projectExports: { config: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/package/codegen.ts'),
  },
  variables: { TPL_BACKEND_SCHEMA: {} },
});

const graphql = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'graphql',
  projectExports: { '*': {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/generated/graphql.tsx',
    ),
  },
  variables: {},
});

const service = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'service',
  projectExports: { createApolloClient: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/apollo/index.ts',
    ),
  },
  variables: { TPL_CREATE_ARGS: {}, TPL_LINK_BODIES: {}, TPL_LINKS: {} },
});

export const APOLLO_REACT_APOLLO_TEMPLATES = {
  appApolloProvider,
  cache,
  codegenConfig,
  graphql,
  service,
};
