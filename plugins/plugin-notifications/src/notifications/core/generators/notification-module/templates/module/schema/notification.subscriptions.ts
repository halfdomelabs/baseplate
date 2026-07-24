// @ts-nocheck

import { builder } from '%pothosImports';
import { getPubSub } from '%yogaPluginImports';

/**
 * Real-time invalidation: fires whenever the current user's notifications change
 * (created, read, or deleted) and carries the new unread count. Clients refetch
 * the feed on receipt — one signal keeps both the list and the badge in sync,
 * across tabs. The topic is per-user (keyed on the authenticated id), so the
 * count it carries is always the subscriber's own.
 */
builder.subscriptionField('notificationsChanged', (t) =>
  t.int({
    authorize: ['user'],
    subscribe: (_root, _args, context) =>
      getPubSub().subscribe(
        'notificationsChanged',
        context.auth.userIdOrThrow(),
      ),
    resolve: (payload) => payload.count,
  }),
);
