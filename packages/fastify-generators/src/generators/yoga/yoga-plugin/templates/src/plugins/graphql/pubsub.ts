// @ts-nocheck

import type { RedisRuntime } from '%fastifyRedisImports';
import type { PubSub } from 'graphql-yoga';

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

export type PubSubPublishArgs = Record<
  string,
  [] | [unknown] | [number | string, unknown]
> &
  TPL_PUBLISH_ARGS;

/**
 * Creates a yoga `PubSub` backed by a dedicated publish/subscribe connection
 * pair. `redis.createConnection` is lazy-connect, so this performs no I/O;
 * the connections are torn down by {@link RedisRuntime.dispose}.
 */
export function createGraphqlPubSub(
  redis: RedisRuntime,
): PubSub<PubSubPublishArgs> {
  const eventTarget = createRedisEventTarget({
    publishClient: redis.createConnection(),
    subscribeClient: redis.createConnection(),
  });
  return createPubSub<PubSubPublishArgs>({ eventTarget });
}
