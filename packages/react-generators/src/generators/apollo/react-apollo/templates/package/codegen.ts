// @ts-nocheck

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: TPL_BACKEND_SCHEMA,
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
