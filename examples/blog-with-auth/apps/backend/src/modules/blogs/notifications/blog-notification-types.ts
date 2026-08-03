import { z } from 'zod';

import { defineNotificationType } from '@src/modules/notifications/services/notification-registry.js';

/**
 * Example notification types, one per category, so the preference matrix can be
 * exercised end to end from the admin settings page.
 *
 * They live here rather than in the notifications module because notification
 * types belong to the feature that raises them — the module owns delivery, not
 * the vocabulary.
 */

/** A comment landed on one of your posts. In-app by default; email is opt-in. */
export const POST_COMMENTED_TYPE = defineNotificationType({
  key: 'post.commented',
  version: 1,
  category: 'general',
  paramsSchema: z.object({
    postId: z.string(),
    postTitle: z.string(),
    commenterName: z.string(),
  }),
  channels: ['inApp', 'email'],
  render: (event) => ({
    body: [
      { type: 'text', value: event.params.commenterName, bold: true },
      { type: 'text', value: ' commented on ' },
      { type: 'text', value: event.params.postTitle, bold: true },
    ],
    actionUrl: `/admin/blogs/posts/${event.params.postId}`,
  }),
});

/**
 * Someone liked a post — the noisy type the ticket's motivating case names
 * ("I want comments but not likes"). Shares the `general` category with
 * comments, so silencing it needs a type-scoped preference rather than a
 * category one.
 */
export const POST_LIKED_TYPE = defineNotificationType({
  key: 'post.liked',
  version: 1,
  category: 'general',
  paramsSchema: z.object({
    postId: z.string(),
    postTitle: z.string(),
    likerName: z.string(),
  }),
  channels: ['inApp'],
  render: (event) => ({
    body: [
      { type: 'text', value: event.params.likerName, bold: true },
      { type: 'text', value: ' liked ' },
      { type: 'text', value: event.params.postTitle, bold: true },
    ],
    actionUrl: `/admin/blogs/posts/${event.params.postId}`,
  }),
});

/**
 * A security alert. In the `security` category, which is mandatory — this one
 * arrives however the recipient has set their preferences.
 */
export const SECURITY_ALERT_TYPE = defineNotificationType({
  key: 'account.securityAlert',
  version: 1,
  category: 'security',
  paramsSchema: z.object({
    action: z.string(),
    ipAddress: z.string().optional(),
  }),
  channels: ['inApp', 'email'],
  render: (event) => ({
    body: [
      { type: 'text', value: 'Security alert: ', bold: true },
      { type: 'text', value: event.params.action },
      ...(event.params.ipAddress
        ? [{ type: 'text' as const, value: ` from ${event.params.ipAddress}` }]
        : []),
    ],
    actionUrl: '/admin/accounts/users',
  }),
});

/** Every example type, for registering with the runtime. */
export const BLOG_NOTIFICATION_TYPES = [
  POST_COMMENTED_TYPE,
  POST_LIKED_TYPE,
  SECURITY_ALERT_TYPE,
];
