import { createSigner } from '@src/services/app-secret.js';
import { getApiUrl } from '@src/services/app-urls.js';
import { prisma } from '@src/services/prisma.js';

import type { NotificationTopicKey } from '../constants/notification-topics.js';
import type { NotificationService } from './notification.service.js';

import { isNotificationTopicKey } from '../constants/notification-topics.js';

/** Where the `List-Unsubscribe` header points. */
export const UNSUBSCRIBE_PATH = '/notifications/unsubscribe';

/** Query parameter carrying the link's token. */
export const UNSUBSCRIBE_TOKEN_PARAM = 't';

const UNSUBSCRIBE_CHANNEL = 'email';

/**
 * What a token proves. The topics are signed, not merely carried, so a holder
 * cannot widen a link to topics the mail did not contain.
 */
interface UnsubscribePayload {
  userId: string;
  topicKeys: string[];
}

/** A verified link: whose it is, and the topics it covers. */
export interface UnsubscribeLink {
  userId: string;
  topicKeys: NotificationTopicKey[];
}

/**
 * `accept: 'all'` rather than the default: a link mailed years ago must still
 * work, so rotating `APP_SECRET` cannot invalidate outstanding links.
 *
 * Safe at module scope — config is read inside `sign` and `verify`, not here.
 */
const signer = createSigner<UnsubscribePayload>(
  'notifications:unsubscribe:v1',
  { accept: 'all' },
);

/**
 * Builds an absolute unsubscribe URL covering every topic named.
 *
 * @param userId - Recipient the token is minted for.
 * @param topicKeys - Topics the email covers. Empty yields no URL.
 * @returns The URL, or undefined when there is nothing to unsubscribe from.
 */
export function buildUnsubscribeUrl(
  userId: string,
  topicKeys: readonly NotificationTopicKey[],
): string | undefined {
  if (topicKeys.length === 0) return undefined;
  const params = new URLSearchParams({
    [UNSUBSCRIBE_TOKEN_PARAM]: signer.sign({
      userId,
      topicKeys: [...topicKeys],
    }),
  });
  return getApiUrl(`${UNSUBSCRIBE_PATH}?${params.toString()}`);
}

/**
 * Verifies a link's token.
 *
 * A valid MAC proves this app minted the token, not that it still matches the
 * expected shape — and these tokens never expire, so the payload and its topic
 * keys are checked at runtime rather than trusted.
 *
 * @param token - Raw `t` parameter value.
 * @returns The link, or null when it does not verify or covers nothing.
 */
export function parseUnsubscribeLink(
  token: string | undefined,
): UnsubscribeLink | null {
  if (token === undefined) return null;

  const payload = signer.verify(token);
  if (
    !payload ||
    typeof payload.userId !== 'string' ||
    !Array.isArray(payload.topicKeys)
  ) {
    return null;
  }

  const topicKeys = [...new Set(payload.topicKeys)].filter((key) =>
    isNotificationTopicKey(key),
  );
  return topicKeys.length === 0 ? null : { userId: payload.userId, topicKeys };
}

/**
 * Turns email off for every topic the link covers, writing the same rows the
 * settings UI writes.
 *
 * @param notification - The notification service, for its preference writes.
 * @param link - A verified link from {@link parseUnsubscribeLink}.
 */
export async function applyUnsubscribeLink(
  notification: NotificationService,
  link: UnsubscribeLink,
): Promise<void> {
  // A link outlives the account it was minted for, and the caller is
  // unauthenticated, so a missing recipient is skipped rather than reported.
  const recipient =
    await /* TPL_USER_DELEGATE:START */ prisma.user /* TPL_USER_DELEGATE:END */
      .findUnique({
        where: { id: link.userId },
        select: { id: true },
      });
  if (!recipient) return;

  for (const topicKey of link.topicKeys) {
    await notification.setPreference(link.userId, {
      topicKey,
      channel: UNSUBSCRIBE_CHANNEL,
      mode: 'off',
    });
  }
}
