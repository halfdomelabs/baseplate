// @ts-nocheck

import type { RenderSource } from '$servicesNotificationRenderer';

/**
 * Per-channel renderer overrides a type may declare, one optional method per
 * installed channel. Generated from the same channel set as
 * {@link NotificationChannels}, so the two cannot drift.
 *
 * Declared with method syntax deliberately: methods are bivariant, so a type
 * parameterised on its own params stays assignable to the erased registry type.
 * Written as a property (`email?: (params) => ...`) `TParams` would land in a
 * contravariant position and break that assignment.
 *
 * Renderers are pure and synchronous, like `render` — they return a component
 * to render, they do not render it.
 *
 * Uninstalling a channel removes its method here, so a renderer for a channel
 * the app no longer has loses its parameter types and fails to compile under
 * `noImplicitAny`. It is not rejected by key: the literal reaches the
 * constructor through an `Omit`, which defeats excess-property checking.
 */
export interface NotificationRenderers<TParams> {
  TPL_RENDERER_ENTRIES;
}

/** One recipient's share of a delivery, as handed to a channel. */
export interface ChannelDelivery {
  recipientId: string;
  notification: RenderSource;
  /** Contact details, resolved by the service. */
  recipient: { email: string | null };
}

/**
 * A window's worth of one recipient's notifications, collapsed into one message.
 *
 * Ordered oldest first, and always non-empty — a pair with nothing pending never
 * reaches a channel.
 */
export interface ChannelDigestDelivery {
  recipientId: string;
  notifications: RenderSource[];
  /** Contact details, resolved by the service. */
  recipient: { email: string | null };
}

/** A delivery channel (in-app, email, slack...). */
export interface NotificationChannel {
  deliver(delivery: ChannelDelivery): Promise<void>;
  /**
   * Send a window's notifications as one message.
   *
   * Optional: a channel that cannot batch simply omits it, and the outbox falls
   * back to one {@link NotificationChannel.deliver} per row — the digest still
   * collapses the *window*, just not the messages. Declaring it is what turns a
   * digest into a single send.
   */
  deliverDigest?(delivery: ChannelDigestDelivery): Promise<void>;
}

/** The installed delivery channels, assembled in the composition root. */
export interface NotificationChannels {
  TPL_CHANNEL_ENTRIES;
}

/** A valid channel key. */
export type NotificationChannelKey = keyof NotificationChannels;

/**
 * Where a notification type may be routed. `'inApp'` is a flag on the row plus
 * an inline publish, and has no {@link NotificationChannel} implementation.
 */
export type NotificationRoutingTarget = NotificationChannelKey | 'inApp';

/**
 * Every routing target, for enumerating rather than checking one — the settings
 * API lists a state per target. Rendered from the same source as the channel
 * interface above, so the runtime list and the compile-time union cannot drift.
 */
export const ROUTING_TARGETS =
  TPL_ROUTING_TARGETS satisfies readonly NotificationRoutingTarget[];
