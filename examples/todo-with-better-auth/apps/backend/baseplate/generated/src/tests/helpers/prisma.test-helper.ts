import type { DeepMockProxy } from 'vitest-mock-extended';

import { beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { prisma } from '@src/services/prisma.js';

vi.mock(
  /* TPL_PRISMA_PATH:START */ '@src/services/prisma.js' /* TPL_PRISMA_PATH:END */,
  () => ({
    __esModule: true,
    prisma: mockDeep<typeof prisma>(),
  }),
);

export const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

beforeEach(() => {
  mockReset(prismaMock);
});
