import { graphql } from '@src/gql';

/** How many feed rows the widget loads per page. */
export const FEED_PAGE_SIZE = 20;

/** Fields the widget renders for a single notification, incl. rendered content. */
export const notificationItemFragment = graphql(`
  fragment NotificationItem on Notification {
    id
    type
    readAt
    createdAt
    actor {
      id
      name
    }
    content(locale: "en") {
      fallbackText
      actionUrl
      segments {
        __typename
        ... on NotificationTextSegment {
          value
          bold
        }
        ... on NotificationLinkSegment {
          value
          href
        }
      }
    }
  }
`);

/**
 * The feed + the unseen (badge) and unread (header) counts, loaded when the
 * panel opens.
 *
 * A cursor connection: the feed is a live list, so offset paging would skip or
 * repeat rows when a notification arrives between fetches. The widget reads
 * only the first page; `pageInfo` is selected so a "view all" surface can page
 * with `after` without changing this document.
 */
export const notificationFeedQuery = graphql(`
  query NotificationFeed($first: Int, $after: String) {
    notificationFeed(first: $first, after: $after) {
      edges {
        node {
          ...NotificationItem
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    unseenNotificationCount
    unreadNotificationCount
  }
`);

/** Mark all seen when the panel opens — clears the badge, keeps rows highlighted. */
export const markAllNotificationsSeenMutation = graphql(`
  mutation MarkAllNotificationsSeen {
    markAllNotificationsSeen {
      changedCount
      unseenCount
    }
  }
`);

export const markNotificationReadMutation = graphql(`
  mutation MarkNotificationRead($input: MarkNotificationReadInput!) {
    markNotificationRead(input: $input) {
      changed
      unseenCount
      unreadCount
      notification {
        id
        readAt
        seenAt
      }
    }
  }
`);

export const markAllNotificationsReadMutation = graphql(`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead {
      changedCount
      unseenCount
      unreadCount
    }
  }
`);

/**
 * Fires (over SSE) whenever the current user's notifications change — created,
 * read, or deleted — carrying the new unread count. The widget refetches the
 * feed on receipt, so one signal keeps the list and badge in sync across tabs.
 */
export const notificationsChangedSubscription = graphql(`
  subscription NotificationsChanged {
    notificationsChanged
  }
`);
