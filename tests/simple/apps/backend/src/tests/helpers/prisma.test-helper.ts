import type { DeepMockProxy } from 'vitest-mock-extended';

import { beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import type { PrismaClient } from '@src/generated/prisma/client.js';

import { prisma } from '@src/services/prisma.js';

vi.mock('@src/services/prisma.js', () => ({
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
