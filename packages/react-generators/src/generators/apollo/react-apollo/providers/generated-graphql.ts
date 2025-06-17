import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import { createTsImportMapSchema } from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export const generatedGraphqlImportsSchema = createTsImportMapSchema({
  '*': {},
});

export type GeneratedGraphqlImportsProvider = TsImportMapProviderFromSchema<
  typeof generatedGraphqlImportsSchema
>;

export const generatedGraphqlImportsProvider =
  createReadOnlyProviderType<GeneratedGraphqlImportsProvider>(
    'generated-graphql-imports',
  );
