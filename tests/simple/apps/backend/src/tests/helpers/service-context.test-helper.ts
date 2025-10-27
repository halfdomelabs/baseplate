import type { ServiceContext } from '@src/utils/service-context.js';

import { createServiceContext } from '@src/utils/service-context.js';

export function createTestServiceContext(): ServiceContext {
  return createServiceContext();
}
