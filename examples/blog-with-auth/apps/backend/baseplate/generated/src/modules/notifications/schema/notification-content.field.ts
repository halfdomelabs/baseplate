import { builder } from '@src/plugins/graphql/builder.js';

import { RENDER_SOURCE_SELECT } from '../services/notification-renderer.js';
import { notificationContentType } from './notification-content.object-types.js';
import { notificationObjectType } from './notification.object-type.js';

/**
 * `locale` is an explicit ARG, not request context: Apollo keys its cache by
 * field args, so a language switch produces a separate cache entry instead of
 * silently serving the pre-switch language.
 *
 * `prismaObjectFields` (not `objectField`) because only the Prisma field builder
 * supports `select`, which loads the render-source columns in the same query.
 */
builder.prismaObjectFields(
  /* TPL_NOTIFICATION_OBJECT_TYPE:START */ notificationObjectType /* TPL_NOTIFICATION_OBJECT_TYPE:END */,
  (t) => ({
    content: t.field({
      type: notificationContentType,
      args: { locale: t.arg.string({ required: true, defaultValue: 'en' }) },
      select: RENDER_SOURCE_SELECT,
      resolve: (notification, { locale }, ctx) =>
        ctx.services.notification.renderContent(notification, { locale }),
    }),
  }),
);
