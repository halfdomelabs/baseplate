import type { QueueService } from '@src/types/queue.types.js';

/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Deep-readonly: fields, not just the bag.
 */
export interface RuntimeServices {
  readonly queues: QueueService;
}
