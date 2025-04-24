import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const prismaImportsSchema = createTsImportMapSchema({ prisma: {} });

type PrismaImportsProvider = TsImportMapProviderFromSchema<
  typeof prismaImportsSchema
>;

export const prismaImportsProvider =
  createReadOnlyProviderType<PrismaImportsProvider>('prisma-imports');

export function createPrismaImports(importBase: string): PrismaImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(prismaImportsSchema, {
    prisma: path.join(importBase, 'prisma.js'),
  });
}
