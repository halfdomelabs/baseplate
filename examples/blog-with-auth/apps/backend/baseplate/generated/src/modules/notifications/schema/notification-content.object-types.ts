import { builder } from '@src/plugins/graphql/builder.js';

import type {
  NotificationSegment,
  RenderedContent,
} from '../services/notification-content.js';

type TextSegment = Extract<NotificationSegment, { kind: 'text' }>;
type EmphasisSegment = Extract<NotificationSegment, { kind: 'emphasis' }>;
type LinkSegment = Extract<NotificationSegment, { kind: 'link' }>;

/**
 * Typed content contract. Segments are a real GraphQL union — not a `JSON`
 * scalar — so generated React types are exhaustive rather than `unknown`, and
 * malformed stored JSON can't reach rendering code.
 */
const textSegment = builder
  .objectRef<TextSegment>('NotificationTextSegment')
  .implement({
    fields: (t) => ({
      text: t.exposeString('text'),
    }),
  });

const emphasisSegment = builder
  .objectRef<EmphasisSegment>('NotificationEmphasisSegment')
  .implement({
    fields: (t) => ({
      text: t.exposeString('text'),
    }),
  });

const linkSegment = builder
  .objectRef<LinkSegment>('NotificationLinkSegment')
  .implement({
    fields: (t) => ({
      text: t.exposeString('text'),
      url: t.exposeString('url'),
    }),
  });

const SEGMENT_TYPE_NAMES = {
  text: 'NotificationTextSegment',
  emphasis: 'NotificationEmphasisSegment',
  link: 'NotificationLinkSegment',
} as const;

const notificationSegment = builder.unionType('NotificationSegment', {
  types: [textSegment, emphasisSegment, linkSegment],
  resolveType: (segment) => SEGMENT_TYPE_NAMES[segment.kind],
});

export const notificationContentType = builder
  .objectRef<RenderedContent>('NotificationContent')
  .implement({
    fields: (t) => ({
      title: t.field({
        type: [notificationSegment],
        resolve: (content) => content.title,
      }),
      body: t.field({
        type: [notificationSegment],
        nullable: true,
        resolve: (content) => content.body,
      }),
      actionUrl: t.exposeString('actionUrl', { nullable: true }),
    }),
  });
