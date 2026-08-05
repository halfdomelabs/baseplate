import type { ApolloCache } from '@apollo/client/cache';
import type { ResultOf } from '@graphql-typed-document-node/core';
import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client/react';
import { useNavigate } from '@tanstack/react-router';
import { MdDoneAll, MdNotificationsOff, MdSettings } from 'react-icons/md';

import { cn } from '@src/utils/cn';

import type { notificationItemFragment } from './notification-operations';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Empty, EmptyDescription, EmptyTitle } from '../ui/empty';
import { Spinner } from '../ui/spinner';
import {
  markAllNotificationsReadMutation,
  markNotificationReadMutation,
  notificationFeedQuery,
} from './notification-operations';

type NotificationItem = ResultOf<typeof notificationItemFragment>;
type Segment = NotificationItem['content']['title'][number];

/**
 * Resolves an action URL against the current origin. Returns the in-app path
 * (path + query + hash) for same-origin URLs so the router can handle it, or
 * `null` for cross-origin/non-http URLs that must leave the SPA. Handles both
 * absolute (`https://app.example.com/x`) and relative (`/x`) inputs.
 */
function resolveInAppPath(url: string): string | null {
  try {
    const resolved = new URL(url, globalThis.location.origin);
    if (resolved.origin !== globalThis.location.origin) return null;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return null;
  }
}

/** Render one content segment (a real GraphQL union — text, emphasis or link). */
function SegmentView({ segment }: { segment: Segment }): ReactElement | null {
  switch (segment.__typename) {
    case 'NotificationTextSegment': {
      return <span>{segment.text}</span>;
    }
    case 'NotificationEmphasisSegment': {
      return <strong className="font-semibold">{segment.text}</strong>;
    }
    case 'NotificationLinkSegment': {
      return (
        <a href={segment.url} className="text-primary underline">
          {segment.text}
        </a>
      );
    }
    default: {
      return null;
    }
  }
}

/** Render a run of segments as one line of text. */
function SegmentLine({ segments }: { segments: Segment[] }): ReactElement {
  return (
    <>
      {segments.map((segment, index) => (
        <SegmentView key={index} segment={segment} />
      ))}
    </>
  );
}

interface Props {
  /** Masked feed items (already newest-first from the server). */
  items: NotificationItem[];
  /** Unread rows across the whole feed, not just the loaded page. */
  unreadCount: number;
  loading: boolean;
  /** Optional link to a full notifications page, rendered as a footer link when set. */
  viewAllHref?: string;
  /** Optional link to a preferences page, rendered as a header icon when set. */
  preferencesHref?: string;
  /** Description shown under the empty-state title. */
  emptyDescription?: string;
  /** Called when a click navigates away (row or footer link); lets the host close the panel. */
  onNavigate?: () => void;
}

/** Writes the counts a read mutation returns onto the root query fields. */
function writeCounts(
  cache: ApolloCache,
  payload: { unseenCount: number; unreadCount: number },
): void {
  cache.modify({
    fields: {
      unseenNotificationCount: () => payload.unseenCount,
      unreadNotificationCount: () => payload.unreadCount,
    },
  });
}

/** The dropdown body: the feed list + mark-read affordances. */
export function NotificationPanel({
  items,
  unreadCount,
  loading,
  viewAllHref,
  preferencesHref,
  emptyDescription = 'You have no new notifications.',
  onNavigate,
}: Props): ReactElement {
  const navigate = useNavigate();
  const [markRead] = useMutation(markNotificationReadMutation, {
    update: (cache, { data }) => {
      if (data) writeCounts(cache, data.markNotificationRead);
    },
  });
  const [markAllRead] = useMutation(markAllNotificationsReadMutation, {
    refetchQueries: [notificationFeedQuery],
  });

  const hasUnread = unreadCount > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-sm font-semibold">Notifications</span>
        {hasUnread && (
          <Badge variant="secondary" className="h-[18px] px-[7px] tabular-nums">
            {unreadCount} unread
          </Badge>
        )}
        <div className="min-w-2 flex-1" />
        {/* Icon-only, and `flex-none` on both: a text label here overflows the
            popover once the unread badge grows. */}
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!hasUnread}
          onClick={() => void markAllRead()}
          aria-label="Mark all as read"
          title="Mark all as read"
          className="flex-none text-muted-foreground"
        >
          <MdDoneAll className="size-4" />
        </Button>
        {preferencesHref && (
          <a
            href={preferencesHref}
            aria-label="Notification settings"
            title="Notification settings"
            /* The 28px hit target overhangs the 16px padding so its glyph
               centres on the unread dot below, 19px from this edge. */
            className="-mr-2.75 flex size-7 flex-none items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground hover:bg-accent hover:text-foreground hover:no-underline"
            onClick={() => onNavigate?.()}
          >
            <MdSettings className="size-4" />
          </a>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <Empty className="py-8">
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <MdNotificationsOff className="size-6" />
          </div>
          <EmptyTitle>No notifications</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </Empty>
      ) : (
        <ul className="max-h-96 divide-y overflow-y-auto">
          {items.map((item) => {
            const { content } = item;
            const isUnread = item.readAt === null;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
                    isUnread && 'bg-accent/40',
                  )}
                  onClick={() => {
                    if (isUnread) {
                      void markRead({ variables: { input: { id: item.id } } });
                    }
                    if (content.actionUrl) {
                      const inAppPath = resolveInAppPath(content.actionUrl);
                      if (inAppPath === null) {
                        globalThis.location.assign(content.actionUrl);
                      } else {
                        void navigate({ to: inAppPath });
                      }
                      onNavigate?.();
                    }
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="line-clamp-2 text-sm">
                      <SegmentLine segments={content.title} />
                    </span>
                    {content.body && content.body.length > 0 && (
                      // Clamped: a body is arbitrary length, and one long
                      // notification must not push the rest out of the popover.
                      <span className="line-clamp-2 text-sm text-muted-foreground">
                        <SegmentLine segments={content.body} />
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {isUnread && (
                    // Nudged to sit on the title's first line, which the
                    // clamped text may wrap beneath.
                    <span className="mt-1.75 size-1.5 flex-none rounded-full bg-primary" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {viewAllHref && (
        <div className="border-t p-2">
          <a
            href={viewAllHref}
            className="flex h-[30px] items-center justify-center rounded-sm text-xs font-medium text-primary hover:bg-accent hover:no-underline"
          >
            View all notifications →
          </a>
        </div>
      )}
    </div>
  );
}
