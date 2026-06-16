import type { PubSub } from 'graphql-yoga';

import { createRedisEventTarget } from '@graphql-yoga/redis-event-target';
import { createPubSub } from 'graphql-yoga';

import { createRedisClient } from '@src/services/redis.js';

/**
 * Map of subscription channel name to the arguments accepted by `pubSub.publish`.
 *
 * Add a channel as `channelName: [payload: PayloadType]` (or
 * `[topicId, payload]` for dynamic topics), then publish to it from your
 * mutations and subscribe to it from a `builder.subscriptionField`.
 *
 * @see https://the-guild.dev/graphql/yoga-server/docs/features/subscriptions
 */
// must be a type to be used in the PubSub type

type PubSubPublishArgs = /* TPL_PUBLISH_ARGS:START */ Record<
  string,
  never
> /* TPL_PUBLISH_ARGS:END */;

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
