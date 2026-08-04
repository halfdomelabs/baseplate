import { builder } from '@src/plugins/graphql/builder.js';

import type {
  NotificationSegment,
  RenderedContent,
} from '../services/notification-content.js';

type TextSegment = Extract<NotificationSegment, { type: 'text' }>;
type LinkSegment = Extract<NotificationSegment, { type: 'link' }>;

/**
 * Typed content contract. Segments are a real GraphQL union — not a `JSON`
 * scalar — so generated React types are exhaustive rather than `unknown`, and
 * malformed stored JSON can't reach rendering code.
 */
const textSegment = builder
  .objectRef<TextSegment>('NotificationTextSegment')
  .implement({
    fields: (t) => ({
      value: t.exposeString('value'),
      bold: t.boolean({ resolve: (s) => s.bold ?? false }),
    }),
  });

const linkSegment = builder
  .objectRef<LinkSegment>('NotificationLinkSegment')
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
