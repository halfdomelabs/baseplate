// @ts-nocheck

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: TPL_BACKEND_SCHEMA_PATH,
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
        scalars: TPL_SCALARS,
      },
    },
  },
};

export default config;
