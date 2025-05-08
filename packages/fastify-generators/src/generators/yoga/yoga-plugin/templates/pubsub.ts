// @ts-nocheck

import type { PubSub } from 'graphql-yoga';

import { createRedisClient } from '%fastifyRedisImports';
import { createRedisEventTarget } from '@graphql-yoga/redis-event-target';
import { createPubSub } from 'graphql-yoga';

// must be a type to be used in the PubSub type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type PubSubPublishArgs = TPL_PUBLISH_ARGS;

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
