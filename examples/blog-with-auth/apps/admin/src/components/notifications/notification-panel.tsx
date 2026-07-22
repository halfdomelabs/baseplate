import type { ResultOf } from '@graphql-typed-document-node/core';
import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client/react';
import { MdClose } from 'react-icons/md';

import type { notificationItemFragment } from './notification-operations';

import { Button } from '../ui/button';
import { Empty, EmptyDescription, EmptyTitle } from '../ui/empty';
import { Spinner } from '../ui/spinner';
import {
  deleteNotificationMutation,
  FEED_PAGE_SIZE,
  markAllNotificationsReadMutation,
  markNotificationReadMutation,
  notificationFeedQuery,
} from './notification-operations';

type NotificationItem = ResultOf<typeof notificationItemFragment>;
type Segment = NotificationItem['content']['segments'][number];

/** Render one content segment (a real GraphQL union — text or link). */
function SegmentView({ segment }: { segment: Segment }): ReactElement | null {
  switch (segment.__typename) {
    case 'NotificationTextSegment': {
      return segment.bold ? (
        <strong className="font-semibold">{segment.value}</strong>
      ) : (
        <span>{segment.value}</span>
      );
    }
    case 'NotificationLinkSegment': {
      return (
        <a href={segment.href} className="text-primary underline">
          {segment.value}
        </a>
      );
    }
    default: {
      return null;
    }
  }
}

interface Props {
  /** Masked feed items (already newest-first from the server). */
  items: NotificationItem[];
  loading: boolean;
}

/** The dropdown body: the feed list + mark-read affordances. */
export function NotificationPanel({ items, loading }: Props): ReactElement {
  const [markRead] = useMutation(markNotificationReadMutation);
  const [markAllRead] = useMutation(markAllNotificationsReadMutation);
  const [deleteNotification] = useMutation(deleteNotificationMutation, {
    // Evict the deleted row (drops it from the feed) and reconcile the badge
    // count from the payload — both without a refetch.
    update: (cache, { data }) => {
      const result = data?.deleteNotification;
      if (!result?.deletedId) return;
      cache.evict({
        id: cache.identify({
          __typename: 'Notification',
          id: result.deletedId,
        }),
      });
      cache.gc();
      cache.updateQuery(
        { query: notificationFeedQuery, variables: { take: FEED_PAGE_SIZE } },
        (existing) =>
          existing
            ? { ...existing, unseenNotificationCount: result.unseenCount }
            : existing,
      );
    },
  });

  const hasUnread = items.some((item) => item.readAt === null);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium">Notifications</span>
        <Button
          variant="link"
          size="none"
          disabled={!hasUnread}
          onClick={() => void markAllRead()}
          className="text-xs"
        >
          Mark all read
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <Empty className="py-8">
          <EmptyTitle>All caught up</EmptyTitle>
          <EmptyDescription>You have no notifications yet.</EmptyDescription>
        </Empty>
      ) : (
        <ul className="max-h-96 divide-y overflow-y-auto">
          {items.map((item) => {
            const { content } = item;
            const isUnread = item.readAt === null;
            return (
              <li
                key={item.id}
                className={
                  isUnread
                    ? 'flex items-start gap-2 bg-accent/40 px-4 py-3'
                    : 'flex items-start gap-2 px-4 py-3'
                }
              >
                <button
                  type="button"
                  className="flex flex-1 flex-col items-start gap-1 text-left"
                  onClick={() => {
                    if (isUnread) {
                      void markRead({ variables: { input: { id: item.id } } });
                    }
                    if (content.actionUrl) {
                      globalThis.location.assign(content.actionUrl);
                    }
                  }}
                >
                  <span className="text-sm">
                    {content.segments.length > 0 ? (
                      content.segments.map((segment, index) => (
                        <SegmentView key={index} segment={segment} />
                      ))
                    ) : (
                      <span>{content.fallbackText}</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Delete notification"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    void deleteNotification({
                      variables: { input: { id: item.id } },
                    })
                  }
                >
                  <MdClose />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
