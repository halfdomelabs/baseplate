import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  projectScope,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import {
  apolloErrorImportsProvider,
  createApolloErrorImports,
} from './generated/ts-import-maps.js';
import { APOLLO_APOLLO_ERROR_TS_TEMPLATES } from './generated/ts-templates.js';

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
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        apolloError: apolloErrorProvider.export(projectScope),
        apolloErrorImports: apolloErrorImportsProvider.export(projectScope),
      },
      run({ typescriptFile }) {
        const utilPath = '@/src/utils/apollo-error.ts';

        return {
          providers: {
            apolloError: {
              getImportMap: () => ({
                '%apollo-error/utils': {
                  path: utilPath,
                  allowedImports: ['getApolloErrorCode'],
                },
              }),
            },
            apolloErrorImports: createApolloErrorImports('@/src/utils'),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: APOLLO_APOLLO_ERROR_TS_TEMPLATES.apolloError,
                destination: utilPath,
              }),
            );
          },
        };
      },
    }),
  }),
});

export { apolloErrorImportsProvider } from './generated/ts-import-maps.js';
