// @ts-nocheck

import type { notificationItemFragment } from '$notificationOperations';
import type { ApolloCache } from '@apollo/client/cache';
import type { ResultOf } from '@graphql-typed-document-node/core';
import type { ReactElement } from 'react';

import {
  markAllNotificationsReadMutation,
  markNotificationReadMutation,
} from '$notificationOperations';
import {
  Badge,
  Button,
  cn,
  Empty,
  EmptyDescription,
  EmptyTitle,
  Spinner,
} from '%reactComponentsImports';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from '@tanstack/react-router';
import { MdDoneAll, MdNotifications, MdNotificationsOff } from 'react-icons/md';

type NotificationItem = ResultOf<typeof notificationItemFragment>;
type Segment = NotificationItem['content']['segments'][number];

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

/** Two-letter initials from a display name, e.g. "Dana Mehta" -> "DM". */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts.at(0)?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Avatar circle: actor initials when the notification has an actor, else a generic bell icon. */
function NotificationAvatar({
  actor,
}: {
  actor: NotificationItem['actor'];
}): ReactElement {
  return (
    <div className="flex size-8 flex-none items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {actor?.name ? (
        getInitials(actor.name)
      ) : (
        <MdNotifications className="size-4" />
      )}
    </div>
  );
}

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
  /** Unread rows across the whole feed, not just the loaded page. */
  unreadCount: number;
  loading: boolean;
  /** Optional link to a full notifications page, rendered as a footer link when set. */
  viewAllHref?: string;
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
    update: (cache, { data }) => {
      if (data) writeCounts(cache, data.markAllNotificationsRead);
    },
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
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="xs"
          disabled={!hasUnread}
          onClick={() => void markAllRead()}
          className="gap-1 text-xs"
        >
          <MdDoneAll className="size-3.5" />
          Mark all as read
        </Button>
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
                  <NotificationAvatar actor={item.actor} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
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
                  </div>
                  {isUnread && (
                    <span className="mt-1.5 size-1.5 flex-none rounded-full bg-primary" />
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
