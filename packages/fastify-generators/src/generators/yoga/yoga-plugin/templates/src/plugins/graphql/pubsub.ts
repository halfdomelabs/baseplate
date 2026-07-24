// @ts-nocheck

import type { PubSub } from 'graphql-yoga';

import { createRedisClient } from '%fastifyRedisImports';
import { createRedisEventTarget } from '@graphql-yoga/redis-event-target';
import { createPubSub } from 'graphql-yoga';

/**
 * Map of subscription channel name to the arguments accepted by `pubSub.publish`.
 *
 * Channels are registered by features/plugins via the yoga plugin's
 * `publishArgs` config. Each entry is `channelName: [payload: PayloadType]` (or
 * `[topicId, payload]` for dynamic topics); publish to it from your mutations
 * and subscribe from a `builder.subscriptionField`.
 *
 * The base index signature satisfies graphql-yoga's `PubSubPublishArgsByKey`
 * constraint; registered channels are intersected in for per-channel typing.
 *
 * @see https://the-guild.dev/graphql/yoga-server/docs/features/subscriptions
 */
// must be a type to be used in the PubSub type

type PubSubPublishArgs = Record<
  string,
  [] | [unknown] | [number | string, unknown]
> &
  TPL_PUBLISH_ARGS;

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
