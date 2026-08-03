import type { ReactElement } from 'react';

import {
  useApolloClient,
  useMutation,
  useQuery,
  useSubscription,
} from '@apollo/client/react';
import { useState } from 'react';
import { MdNotifications } from 'react-icons/md';

import { readFragment } from '@src/gql';
import { useSession } from '@src/hooks/use-session';

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

interface Props {
  /** Optional link to a full notifications page, rendered as a footer link when set. */
  viewAllHref?: string;
  /** Description shown under the empty-state title. */
  emptyDescription?: string;
}

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
export function NotificationBell({
  viewAllHref,
  emptyDescription,
}: Props = {}): ReactElement | null {
  const { isAuthenticated } = useSession();
  const client = useApolloClient();
  const [open, setOpen] = useState(false);

  const { data, loading, refetch } = useQuery(notificationFeedQuery, {
    variables: { first: FEED_PAGE_SIZE },
    skip: !isAuthenticated,
  });

  const [markAllSeen] = useMutation(markAllNotificationsSeenMutation);

  useSubscription(notificationsChangedSubscription, {
    skip: !isAuthenticated,
    onData: ({ data: { data: subData } }) => {
      // Instant badge from the pushed count...
      if (subData) {
        const unseenNotificationCount = subData.notificationsChanged;
        const query = { query: notificationFeedQuery };
        client.cache.updateQuery(query, (existing) => {
          if (!existing) return existing;
          return { ...existing, unseenNotificationCount };
        });
      }
      // ...then refetch for the authoritative newest-first list.
      void refetch();
    },
  });

  if (!isAuthenticated) return null;

  const unseenCount = data?.unseenNotificationCount ?? 0;
  const unreadCount = data?.unreadNotificationCount ?? 0;
  const items = (data?.notificationFeed.edges ?? []).map((edge) =>
    readFragment(notificationItemFragment, edge.node),
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
        <MdNotifications className="size-5" />
        {unseenCount > 0 && (
          <Badge className="absolute top-0.5 right-0 h-[18px] min-w-[18px] justify-center rounded-full border-2 border-background bg-primary p-0 text-[11px] text-primary-foreground tabular-nums">
            {unseenCount > 99 ? '99+' : unseenCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <NotificationPanel
          items={items}
          unreadCount={unreadCount}
          loading={loading}
          viewAllHref={viewAllHref}
          emptyDescription={emptyDescription}
          onNavigate={() => {
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
