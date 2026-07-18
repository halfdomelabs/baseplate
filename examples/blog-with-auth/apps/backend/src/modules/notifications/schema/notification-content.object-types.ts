import { builder } from '@src/plugins/graphql/builder.js';

import type {
  NotificationSegment,
  RenderedContent,
} from '../services/notification-content.js';

/**
 * Typed content contract. Segments are a real GraphQL union — NOT a `JSON`
 * scalar — so generated React types are exhaustive rather than `unknown`, and
 * malformed stored JSON can't reach rendering code.
 */
const textSegment = builder
  .objectRef<
    Extract<NotificationSegment, { type: 'text' }>
  >('NotificationTextSegment')
  .implement({
    fields: (t) => ({
      value: t.exposeString('value'),
      bold: t.boolean({ resolve: (s) => s.bold ?? false }),
    }),
  });

const linkSegment = builder
  .objectRef<
    Extract<NotificationSegment, { type: 'link' }>
  >('NotificationLinkSegment')
  .implement({
    fields: (t) => ({
      value: t.exposeString('value'),
      href: t.exposeString('href'),
    }),
  });

const notificationSegment = builder.unionType('NotificationSegment', {
  types: [textSegment, linkSegment],
  resolveType: (segment) =>
    segment.type === 'text'
      ? 'NotificationTextSegment'
      : 'NotificationLinkSegment',
});

/**
 * A notification's content, rendered atomically: every field comes from the same
 * renderer invocation, so content can never mix two renderer versions.
 */
export const notificationContentType = builder
  .objectRef<RenderedContent>('NotificationContent')
  .implement({
    fields: (t) => ({
      segments: t.field({
        type: [notificationSegment],
        resolve: (content) => content.segments,
      }),
      fallbackText: t.exposeString('fallbackText'),
      actionUrl: t.exposeString('actionUrl', { nullable: true }),
    }),
  });
