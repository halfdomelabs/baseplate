// @ts-nocheck

import {
  createServiceContext,
  ServiceContext,
} from '@src/utils/service-context.js';

export function createTestServiceContext(TPL_CREATE_TEST_ARGS): ServiceContext {
  return createServiceContext(TPL_CREATE_TEST_OBJECT);
}
