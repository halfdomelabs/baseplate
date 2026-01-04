import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import { createTsImportMapSchema } from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export const graphqlImportsSchema = createTsImportMapSchema({
  graphql: {},
  readFragment: {},
  FragmentOf: { isTypeOnly: true },
  ResultOf: { isTypeOnly: true },
  VariablesOf: { isTypeOnly: true },
});

export type GraphqlImportsProvider = TsImportMapProviderFromSchema<
  typeof graphqlImportsSchema
>;

export const graphqlImportsProvider =
  createReadOnlyProviderType<GraphqlImportsProvider>('graphql-imports');
