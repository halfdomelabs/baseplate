import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import { createTsImportMapSchema } from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export const prismaGeneratedImportsSchema = createTsImportMapSchema({
  PrismaClient: {},
  Prisma: {},
  '*': {},
});

export type PrismaGeneratedImportsProvider = TsImportMapProviderFromSchema<
  typeof prismaGeneratedImportsSchema
>;

export const prismaGeneratedImportsProvider =
  createReadOnlyProviderType<PrismaGeneratedImportsProvider>(
    'prisma-generated-imports',
  );
