import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const appApolloProvider = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'app-apollo-provider',
  referencedGeneratorTemplates: { service: {} },
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
  group: 'main',
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

const codegen = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'codegen',
  source: {
    path: path.join(import.meta.dirname, '../templates/package/codegen.ts'),
  },
  variables: { TPL_BACKEND_SCHEMA_PATH: {}, TPL_SCALARS: {} },
});

const gqlFragmentMasking = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'gql-fragment-masking',
  projectExports: { FragmentType: { isTypeOnly: true }, readFragment: {} },
  projectExportsOnly: true,
  source: { contents: '' },
  variables: {},
});

const gqlGql = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'gql-gql',
  projectExports: { graphql: {} },
  projectExportsOnly: true,
  source: { contents: '' },
  variables: {},
});

const gqlGraphql = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'gql-graphql',
  projectExports: { '*': {} },
  projectExportsOnly: true,
  source: { contents: '' },
  variables: {},
});

const graphqlConfig = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'graphql-config',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/package/graphql.config.ts',
    ),
  },
  variables: { TPL_BACKEND_SCHEMA_PATH: {} },
});

const service = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'service',
  projectExports: { createApolloClient: {} },
  referencedGeneratorTemplates: { cache: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/apollo/index.ts',
    ),
  },
  variables: { TPL_CREATE_ARGS: {}, TPL_LINK_BODIES: {}, TPL_LINKS: {} },
});

export const mainGroup = {
  appApolloProvider,
  cache,
  codegen,
  gqlFragmentMasking,
  gqlGql,
  gqlGraphql,
  graphqlConfig,
  service,
};

export const APOLLO_REACT_APOLLO_TEMPLATES = { mainGroup };
