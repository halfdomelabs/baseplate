import { graphql } from '@src/gql';

/** How many feed rows the widget loads; shared by the query + cache writes. */
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

/** The feed + unseen badge count, loaded when the panel opens. */
export const notificationFeedQuery = graphql(`
  query NotificationFeed($take: Int) {
    notifications(take: $take) {
      ...NotificationItem
    }
    unseenNotificationCount
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
    }
  }
`);

export const deleteNotificationMutation = graphql(`
  mutation DeleteNotification($input: DeleteNotificationInput!) {
    deleteNotification(input: $input) {
      deletedId
      unseenCount
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
