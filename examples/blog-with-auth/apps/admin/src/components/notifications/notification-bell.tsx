import type { ReactElement } from 'react';

import {
  useApolloClient,
  useMutation,
  useQuery,
  useSubscription,
} from '@apollo/client/react';
import { useState } from 'react';
import { MdNotificationsNone } from 'react-icons/md';

import { readFragment } from '@src/gql';

import { useSession } from '../../hooks/use-session';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  FEED_PAGE_SIZE,
  markAllNotificationsSeenMutation,
  notificationFeedQuery,
  notificationItemFragment,
  notificationsChangedSubscription,
} from './notification-operations';
import { NotificationPanel } from './notification-panel';

/**
 * Header bell: unseen badge + a popover feed, kept live over SSE.
 *
 * Seen vs read: opening the panel marks everything seen (badge → 0) but leaves
 * rows highlighted; clicking a row marks it read (clears its highlight). A single
 * `notificationsChanged` signal (created/read/seen/deleted) writes the pushed
 * count for an instant badge, then refetches the authoritative feed — so list and
 * badge stay in sync across tabs. Renders nothing for an unauthenticated session
 * (the subscription requires `['user']`).
 */
export function NotificationBell(): ReactElement | null {
  const { isAuthenticated } = useSession();
  const client = useApolloClient();
  const [open, setOpen] = useState(false);

  const { data, loading, refetch } = useQuery(notificationFeedQuery, {
    variables: { take: FEED_PAGE_SIZE },
    skip: !isAuthenticated,
  });

  const [markAllSeen] = useMutation(markAllNotificationsSeenMutation);

  useSubscription(notificationsChangedSubscription, {
    skip: !isAuthenticated,
    onData: ({ data: { data: subData } }) => {
      // Instant badge from the pushed count...
      if (subData) {
        client.cache.updateQuery(
          { query: notificationFeedQuery, variables: { take: FEED_PAGE_SIZE } },
          (existing) =>
            existing
              ? {
                  ...existing,
                  unseenNotificationCount: subData.notificationsChanged,
                }
              : existing,
        );
      }
      // ...then refetch for the authoritative newest-first list.
      void refetch();
    },
  });

  if (!isAuthenticated) return null;

  const unseenCount = data?.unseenNotificationCount ?? 0;
  const items = (data?.notifications ?? []).map((item) =>
    readFragment(notificationItemFragment, item),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Opening acknowledges the batch: clear the badge, keep rows highlighted.
        if (next && unseenCount > 0) void markAllSeen();
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative"
          />
        }
      >
        <MdNotificationsNone className="size-5" />
        {unseenCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0"
          >
            {unseenCount > 99 ? '99+' : unseenCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <NotificationPanel items={items} loading={loading} />
      </PopoverContent>
    </Popover>
  );
}
