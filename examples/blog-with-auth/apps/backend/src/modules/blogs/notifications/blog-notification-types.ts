import { PostCommentedEmail } from '@blog-with-auth/transactional';
import { z } from 'zod';

import type { NotificationSegment } from '@src/modules/notifications/services/notification-content.js';

import { notificationEmail } from '@src/modules/notifications/channels/email.channel.js';
import {
  defineBatchedNotificationType,
  defineNotificationType,
} from '@src/modules/notifications/registry.js';

import { summarizePostLikes } from '../services/blog-post-like.service.js';

/**
 * Example notification types, covering both constructors and both the
 * in-a-topic and topic-less paths, so the preference matrix can be exercised
 * end to end from the admin settings page.
 *
 * They live here rather than in the notifications module because notification
 * types belong to the feature that raises them — the module owns delivery, not
 * the vocabulary.
 */

/**
 * A comment landed on one of your posts. In-app by default; email is opt-in.
 *
 * Declares an `email` renderer, so mail gets a bespoke template while the feed
 * still renders the segments `render` returns — one channel-neutral definition,
 * adapted per channel rather than duplicated.
 */
export const POST_COMMENTED_TYPE = defineNotificationType({
  key: 'post.commented',
  version: 1,
  topic: 'postComments',
  paramsSchema: z.object({
    postId: z.string(),
    postTitle: z.string(),
    commenterName: z.string(),
  }),
  channels: ['inApp', 'email'],
  render: (params) => ({
    title: [
      { kind: 'emphasis', text: params.commenterName },
      { kind: 'text', text: ' commented on ' },
      { kind: 'emphasis', text: params.postTitle },
    ],
    actionUrl: `/admin/blogs/posts/${params.postId}`,
  }),
  renderers: {
    email: (params) =>
      notificationEmail(PostCommentedEmail, {
        commenterName: params.commenterName,
        postTitle: params.postTitle,
        actionUrl: `/admin/blogs/posts/${params.postId}`,
      }),
  },
});

/**
 * How many likers a notification names before collapsing the rest into a count.
 * Bounded so the stored params never grow with a viral post.
 */
const ACTOR_SAMPLE_SIZE = 3;

/**
 * Likes on a post, as one collapsing notification per post rather than one per
 * like.
 *
 * BATCHED because the caller should not have to know how a like notification is
 * aggregated: it says "this post was liked" and `resolveParams` reads the post's
 * whole current like state.
 *
 * `resolveParams` runs twice per row with different windows: at write time with
 * no boundary, storing the state the feed renders, and again per outbound send
 * with `since` set to that channel's last delivery, so the email leads with
 * what is new. One row, two phrasings, nothing written back.
 *
 * The group key comes from `postId` alone, so the like path and the unlike path
 * cannot disagree about which row to replace or withdraw.
 */
export const POST_LIKED_TYPE = defineBatchedNotificationType({
  key: 'post.liked',
  version: 1,
  topic: 'postLikes',
  inputSchema: z.object({ postId: z.string() }),
  groupKey: ({ postId }) => `blogPost:${postId}:likes`,
  paramsSchema: z.object({
    postId: z.string(),
    postTitle: z.string(),
    /** The most recent likers, capped — `count` carries the real total. */
    likerNames: z.array(z.string()),
    count: z.number(),
    /**
     * Likes since this channel last delivered. Set only on the delivery path,
     * so the stored params never carry it and a notify comparing against them
     * sees no spurious churn.
     */
    newCount: z.number().optional(),
  }),
  resolveParams: ({ postId }, { since }) =>
    summarizePostLikes(postId, ACTOR_SAMPLE_SIZE, since),
  channels: ['inApp', 'email'],
  render: (params) => {
    const { likerNames, count, postTitle, postId, newCount } = params;
    const [first = 'Someone'] = likerNames;
    const others = count - 1;
    // Delta when this send knows what the recipient was last told, state
    // otherwise — the feed always takes the second branch.
    const title: NotificationSegment[] =
      newCount === undefined
        ? [
            { kind: 'emphasis', text: first },
            {
              kind: 'text',
              text:
                others > 0
                  ? ` and ${others} other${others > 1 ? 's' : ''}`
                  : '',
            },
            { kind: 'text', text: ' liked ' },
            { kind: 'emphasis', text: postTitle },
          ]
        : [
            {
              kind: 'text',
              text: `${newCount} new like${newCount === 1 ? '' : 's'} on `,
            },
            { kind: 'emphasis', text: postTitle },
          ];
    return {
      title,
      // Only alongside a delta; on its own the total repeats the title.
      body:
        newCount === undefined
          ? undefined
          : `${count} like${count === 1 ? '' : 's'} in total`,
      actionUrl: `/admin/blogs/posts/${postId}`,
    };
  },
});

/**
 * A security alert.
 *
 * This type belongs to no topic, and that is the whole mechanism: a type in no
 * topic consults no preference row, so it arrives however the recipient has set
 * their settings. There is no `mandatory` flag to set — not belonging to a topic
 * is the flag, so no settings page can render a toggle that would silence it.
 */
export const SECURITY_ALERT_TYPE = defineNotificationType({
  key: 'account.securityAlert',
  version: 1,
  paramsSchema: z.object({
    action: z.string(),
    ipAddress: z.string().optional(),
  }),
  channels: ['inApp', 'email'],
  render: (params) => ({
    title: [
      { kind: 'emphasis', text: 'Security alert: ' },
      { kind: 'text', text: params.action },
    ],
    // The detail line the title deliberately omits: the feed shows the title
    // alone, while email and push have room for both.
    body: params.ipAddress ? `Signed in from ${params.ipAddress}` : undefined,
    actionUrl: '/admin/accounts/users',
  }),
});

/** Every example type, for registering with the runtime. */
export const BLOG_NOTIFICATION_TYPES = [
  POST_COMMENTED_TYPE,
  POST_LIKED_TYPE,
  SECURITY_ALERT_TYPE,
];
