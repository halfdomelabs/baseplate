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
        strictScalars: true,
        scalars: TPL_SCALARS,
      },
    },
  },
  hooks: {
    // Workaround for https://github.com/dotansimha/graphql-code-generator/issues/4900
    // graphql-codegen emits `import * as types` in gql.ts even when there are no documents,
    // causing a TypeScript error with noUnusedLocals. This runs before codegen compares the
    // output against the file on disk, so an unchanged gql.ts is not rewritten on every run.
    beforeOneFileWrite: [
      (path: string, content: string) =>
        path.endsWith('gql.ts')
          ? `${content}\n// @ts-ignore\ntype _Unused = typeof types;\n`
          : content,
    ],
  },
};

export default config;
