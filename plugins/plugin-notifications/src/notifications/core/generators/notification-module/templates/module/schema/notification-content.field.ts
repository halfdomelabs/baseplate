// @ts-nocheck

import { notificationContentType } from '$schemaNotificationContentObjectTypes';
import {
  RENDER_SOURCE_SELECT,
  renderContent,
} from '$servicesNotificationService';
import { builder } from '%pothosImports';

/**
 * The render-at-read site: `renderContent` re-renders from the stored source
 * (`params`) using the renderer that CREATED the row — pinned by
 * `(type, templateVersion)` — falling back to the frozen snapshot on a retired
 * renderer or param drift.
 *
 * `locale` is an explicit ARG, not request context: Apollo keys its cache by
 * field args, so a language switch produces a separate cache entry instead of
 * silently serving the pre-switch language.
 *
 * `prismaObjectFields` (not `objectField`) because only the Prisma field builder
 * supports `select`, which loads the render-source columns in the same query.
 */
builder.prismaObjectFields(TPL_NOTIFICATION_OBJECT_TYPE, (t) => ({
  content: t.field({
    type: notificationContentType,
    args: { locale: t.arg.string({ required: true, defaultValue: 'en' }) },
    select: RENDER_SOURCE_SELECT,
    resolve: (notification, { locale }) =>
      renderContent(notification, { locale }),
  }),
}));
