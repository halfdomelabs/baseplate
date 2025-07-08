import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../backend/schema.graphql',
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
