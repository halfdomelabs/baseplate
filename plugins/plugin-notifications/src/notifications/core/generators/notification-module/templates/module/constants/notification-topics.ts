// @ts-nocheck

import type {
  NotificationChannelKey,
  NotificationRoutingTarget,
} from '$servicesNotificationChannel';

/**
 * The topics notification types are grouped under, declared in the project
 * definition and generated here as a closed set.
 *
 * Topics are the unit user preferences are expressed in: the settings UI renders
 * one row per topic, and `NotificationPreference.topicKey` stores these keys.
 * Generating the full set — rather than collecting it from the type registry at
 * runtime — is what lets the settings page list topics no type has been written
 * for yet.
 *
 * A type belonging to no topic is not listed here and consults no preference at
 * all. That is the v5 replacement for a `mandatory` flag: topic membership is
 * what makes a notification user-controllable.
 */
export const NOTIFICATION_TOPICS =
  TPL_TOPICS satisfies readonly NotificationTopic[];

/**
 * How a channel delivers for a topic.
 *
 * A runtime list as well as a type, so the GraphQL enum is built from the same
 * source rather than repeating the values.
 */
export const NOTIFICATION_MODES = ['off', 'immediate', 'digest'] as const;

export type NotificationMode = (typeof NOTIFICATION_MODES)[number];

/**
 * A channel's resolved setting.
 *
 * The same shape a preference row carries, so a preference is a sparse override
 * of exactly the thing above it and both feed one resolution path.
 */
export interface NotificationChannelSetting {
  mode: NotificationMode;
  /** Only meaningful for `digest`; inherited from the topic when a row omits it. */
  digestWindowSeconds?: number;
}

/** A topic declared in the project definition. */
export interface NotificationTopic {
  key: string;
  label: string;
  description?: string;
  /**
   * Per-channel modes used when the user has no preference row for this topic.
   *
   * A channel absent from the map is `off`, so adding a channel to a project
   * does not silently opt every user into it. Typed as routing targets, so
   * defaulting to a channel the app has not installed is a compile error here
   * rather than a silently ignored entry.
   */
  readonly defaults: Partial<
    Record<NotificationRoutingTarget, NotificationChannelSetting>
  >;
}

/**
 * The key of a declared topic.
 *
 * Narrows `topic` on a notification type, so deleting or renaming a topic in the
 * project definition is a compile error at every `defineNotificationType` site
 * rather than a silently orphaned preference row.
 */
export type NotificationTopicKey = (typeof NOTIFICATION_TOPICS)[number]['key'];

const TOPICS_BY_KEY = new Map<NotificationTopicKey, NotificationTopic>(
  NOTIFICATION_TOPICS.map((topic) => [topic.key, topic]),
);

/**
 * Whether an arbitrary string names a declared topic.
 *
 * For untrusted input — API callers and stored preference rows hold plain
 * strings, so they cannot use {@link getNotificationTopic}, which is total over
 * the key union and throws.
 */
export function isNotificationTopicKey(
  key: string,
): key is NotificationTopicKey {
  return TOPICS_BY_KEY.has(key as NotificationTopicKey);
}

/** Looks up a declared topic. Total over {@link NotificationTopicKey}. */
export function getNotificationTopic(
  key: NotificationTopicKey,
): NotificationTopic {
  const topic = TOPICS_BY_KEY.get(key);
  if (!topic) {
    throw new Error(`Unknown notification topic: ${key}`);
  }
  return topic;
}

/** The feed's routing target — the one target that is not an outbound channel. */
const IN_APP_TARGET = 'inApp';

/** A channel absent from a topic's defaults delivers nothing. */
const OFF: NotificationChannelSetting = { mode: 'off' };

/**
 * A topic's default setting for one routing target.
 *
 * The single place absence is turned into `off`, so the resolver and the
 * settings page cannot disagree about what an unlisted channel means.
 */
function getTopicDefault(
  topic: NotificationTopic,
  target: NotificationRoutingTarget,
): NotificationChannelSetting {
  return topic.defaults[target] ?? OFF;
}

/**
 * Folds a user's stored row (if any) over the topic default.
 *
 * A row is a sparse override: it names a mode, and inherits the topic's window
 * when it does not name one. `digest` is outbound-only — the feed has no window
 * to batch over — so an `inApp` row asking for it is clamped to `immediate`
 * rather than rejected, keeping a stale row from silencing the feed.
 */
export function resolveChannelSetting(
  topic: NotificationTopic,
  target: NotificationRoutingTarget,
  override: NotificationChannelSetting | undefined,
): NotificationChannelSetting {
  const base = getTopicDefault(topic, target);
  if (!override) return base;

  const mode =
    override.mode === 'digest' && !isOutboundTarget(target)
      ? 'immediate'
      : override.mode;

  return {
    mode,
    digestWindowSeconds:
      override.digestWindowSeconds ?? base.digestWindowSeconds,
  };
}

/**
 * Whether a routing target is an outbound channel rather than the feed.
 *
 * A structural check on the target, distinct from the outbox's `isChannelKey`,
 * which asks the different question of whether a channel is actually installed.
 */
export function isOutboundTarget(
  target: NotificationRoutingTarget,
): target is NotificationChannelKey {
  return target !== IN_APP_TARGET;
}
