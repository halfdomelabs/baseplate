import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import path from 'node:path';

const appApolloProvider = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'app-apollo-provider',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/AppApolloProvider.tsx',
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

const codegenYml = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'codegen-yml',
  source: {
    path: path.join(import.meta.dirname, '../templates/package/codegen.yml'),
  },
  variables: { TPL_SCHEMA_LOCATION: { description: 'Location of the schema' } },
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
  codegenYml,
  appApolloProvider,
  graphql,
  cache,
  service,
};
