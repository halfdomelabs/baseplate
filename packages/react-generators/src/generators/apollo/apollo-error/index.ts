import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type ApolloErrorProvider = ImportMapper;

export const apolloErrorProvider =
  createProviderType<ApolloErrorProvider>('apollo-error');

export const apolloErrorGenerator = createGenerator({
  name: 'apollo/apollo-error',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        typescript: typescriptProvider,
      },
      exports: {
        apolloError: apolloErrorProvider.export(projectScope),
      },
      run({ typescript }) {
        const [utilImport, utilPath] = makeImportAndFilePath(
          'src/utils/apollo-error.ts',
        );

        return {
          getProviders: () => ({
            apolloError: {
              getImportMap: () => ({
                '%apollo-error/utils': {
                  path: utilImport,
                  allowedImports: ['getApolloErrorCode'],
                },
              }),
            },
          }),
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'apollo-error.ts',
                destination: utilPath,
              }),
            );
          },
        };
      },
    });
  },
});
