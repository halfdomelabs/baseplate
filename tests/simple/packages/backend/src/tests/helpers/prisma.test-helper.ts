import { PrismaClient } from '@prisma/client';
import { beforeEach, vi } from 'vitest';
import { DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    typeof promises === 'function'
      ? promises(prismaMock)
      : Promise.all(promises),
  );
});
