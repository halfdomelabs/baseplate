import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const prismaVitestImportsSchema = createTsImportMapSchema({
  createTestDatabase: {},
  createTestDatabaseFromTemplate: {},
  destroyTestDatabase: {},
  getTestPrisma: {},
  prismaMock: {},
  replaceDatabase: {},
});

type PrismaVitestImportsProvider = TsImportMapProviderFromSchema<
  typeof prismaVitestImportsSchema
>;

export const prismaVitestImportsProvider =
  createReadOnlyProviderType<PrismaVitestImportsProvider>(
    'prisma-vitest-imports',
  );

export function createPrismaVitestImports(
  importBase: string,
): PrismaVitestImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(prismaVitestImportsSchema, {
    createTestDatabase: path.join(importBase, 'db.test-helper.js'),
    createTestDatabaseFromTemplate: path.join(importBase, 'db.test-helper.js'),
    destroyTestDatabase: path.join(importBase, 'db.test-helper.js'),
    getTestPrisma: path.join(importBase, 'db.test-helper.js'),
    prismaMock: path.join(importBase, 'prisma.test-helper.js'),
    replaceDatabase: path.join(importBase, 'db.test-helper.js'),
  });
}
