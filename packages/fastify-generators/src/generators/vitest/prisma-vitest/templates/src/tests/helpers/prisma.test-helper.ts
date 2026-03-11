// @ts-nocheck

import type { DeepMockProxy } from 'vitest-mock-extended';

import { prisma } from '%prismaImports';
import { beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

vi.mock(TPL_PRISMA_PATH, () => ({
  __esModule: true,
  prisma: mockDeep<typeof prisma>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

beforeEach(() => {
  mockReset(prismaMock);
});
