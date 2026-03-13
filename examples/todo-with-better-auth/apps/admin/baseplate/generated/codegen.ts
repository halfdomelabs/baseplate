import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema:
    /* TPL_BACKEND_SCHEMA_PATH:START */ '../backend/schema.graphql' /* TPL_BACKEND_SCHEMA_PATH:END */,
  documents: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: 'readFragment' },
      },
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        strictScalars: true,
        scalars: /* TPL_SCALARS:START */ {
          DateTime: 'string',
          Date: 'string',
          JSON: 'unknown',
          JSONObject: 'Record<string, unknown>',
          Uuid: 'string',
        } /* TPL_SCALARS:END */,
      },
    },
  },
};

export default config;
