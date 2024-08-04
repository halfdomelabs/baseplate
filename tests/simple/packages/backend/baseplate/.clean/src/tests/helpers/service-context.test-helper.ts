import {
  ServiceContext,
  createServiceContext,
} from '@src/utils/service-context';

export function createTestServiceContext(): ServiceContext {
  return createServiceContext();
}
