// @ts-nocheck

import type { ServiceContext } from '../../utils/service-context.js';

import { createServiceContext } from '../../utils/service-context.js';

export function createTestServiceContext(TPL_CREATE_TEST_ARGS): ServiceContext {
  return createServiceContext(TPL_CREATE_TEST_OBJECT);
}
