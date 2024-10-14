import {
  ServiceContext,
  createServiceContext,
} from '@src/utils/service-context.js';

export function createTestServiceContext(): ServiceContext {
  return createServiceContext();
}
