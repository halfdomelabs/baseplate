// @ts-nocheck

import type { ServiceContext } from '$serviceContext';

import { createServiceContext } from '$serviceContext';

export function createTestServiceContext(TPL_CREATE_TEST_ARGS): ServiceContext {
  return createServiceContext(TPL_CREATE_TEST_OBJECT);
}
