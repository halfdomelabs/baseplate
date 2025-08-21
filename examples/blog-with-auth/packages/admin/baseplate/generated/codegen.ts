import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema:
    /* TPL_BACKEND_SCHEMA:START */ '../backend/schema.graphql' /* TPL_BACKEND_SCHEMA:END */,
  documents: ['src/**/*.gql'],
  config: {
    enumsAsTypes: true,
    scalars: {
      DateTime: 'string',
      Date: 'string',
      Uuid: 'string',
    },
    useTypeImports: true,
  },
  generates: {
    './src/generated/graphql.tsx': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
  },
};

export default config;
