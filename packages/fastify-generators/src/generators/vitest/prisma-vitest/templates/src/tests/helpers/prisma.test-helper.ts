// @ts-nocheck

import type { PrismaClient } from '%prismaGeneratedImports';
import type { DeepMockProxy } from 'vitest-mock-extended';

import { prisma } from '%prismaImports';
import { beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

vi.mock(TPL_PRISMA_PATH, () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);

  // mock $transaction
  prismaMock.$transaction.mockImplementation((promises) =>
    typeof promises === 'function'
      ? promises(prismaMock)
      : Promise.all(promises),
  );
});
