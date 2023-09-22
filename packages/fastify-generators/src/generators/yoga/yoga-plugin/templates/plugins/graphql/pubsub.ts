// @ts-nocheck

import { createPubSub, PubSub } from 'graphql-yoga';
import { createRedisEventTarget } from '@graphql-yoga/redis-event-target';
import { createRedisClient } from '%fastify-redis';

// must be a type to be used in the PubSub type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type PubSubPublishArgs = {};

let cachedPubSub: PubSub<PubSubPublishArgs> | null = null;

export function getPubSub(): PubSub<PubSubPublishArgs> {
  if (cachedPubSub === null) {
    const eventTarget = createRedisEventTarget({
      publishClient: createRedisClient(),
      subscribeClient: createRedisClient(),
    });
    cachedPubSub = createPubSub<PubSubPublishArgs>({ eventTarget });
  }
  return cachedPubSub;
}
