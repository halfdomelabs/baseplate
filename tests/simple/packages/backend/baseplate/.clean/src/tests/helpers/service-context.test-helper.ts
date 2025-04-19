import {
  createServiceContext,
  ServiceContext,
} from '@src/utils/service-context.js';

export function createTestServiceContext(): ServiceContext {
  return createServiceContext();
}
