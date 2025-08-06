import type { InferTsImportMapFromSchema } from '@baseplate-dev/core-generators';

import { createTsImportMapSchema } from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export const queueServiceImportsSchema = createTsImportMapSchema({
  createQueue: {},
});

export type QueueServiceImportsProvider = InferTsImportMapFromSchema<
  typeof queueServiceImportsSchema
>;

export const queueServiceImportsProvider =
  createReadOnlyProviderType<QueueServiceImportsProvider>(
    'queue-service-imports',
  );
