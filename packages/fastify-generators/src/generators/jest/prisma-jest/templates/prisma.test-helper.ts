// @ts-nocheck

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { prisma } from '%prisma-service';

jest.mock('PRISMA_SERVICE_PATH', () => ({
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
