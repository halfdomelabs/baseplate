// @ts-nocheck

import type { NotificationEmailSegment } from '$notificationSegmentView';

import { SegmentsView } from '$notificationSegmentView';
import {
  defineEmail,
  EmailLayout,
  Link,
  Section,
  Text,
  theme,
} from '%transactionalLibImports';
import * as React from 'react';

interface NotificationDigestItem {
  title: NotificationEmailSegment[];
  body?: NotificationEmailSegment[];
  actionUrl?: string;
}

interface NotificationDigestProps {
  /** The window's notifications, oldest first. Never empty. */
  items: NotificationDigestItem[];
}

/**
 * Counts rather than names a period: the digest window is a floor, not a
 * schedule, so "Daily digest" would promise a cadence the sweep does not keep.
 */
function digestSubject(items: NotificationDigestItem[]): string {
  return items.length === 1
    ? '1 new notification'
    : `${items.length} new notifications`;
}

/**
 * A window's notifications collapsed into one email.
 *
 * Separate from the single-notification template rather than a variant of it:
 * that one commits to one title, one body and one action button, which an
 * item list cannot be folded into without leaving both shapes half-expressed.
 */
export default defineEmail<NotificationDigestProps>(NotificationDigestEmail, {
  subject: ({ items }) => digestSubject(items),
  previewProps: {
    items: [
      {
        title: [
          { kind: 'emphasis', text: 'Dana Mehta' },
          { kind: 'text', text: ' commented on your post ' },
          {
            kind: 'link',
            text: 'Hello World',
            url: 'https://example.com/posts/1',
          },
        ],
        body: [{ kind: 'text', text: 'Looks great — shipping this today.' }],
        actionUrl: 'https://example.com/posts/1',
      },
      {
        title: [
          { kind: 'emphasis', text: '4 people' },
          { kind: 'text', text: ' liked your post ' },
          {
            kind: 'link',
            text: 'Shipping Fast',
            url: 'https://example.com/posts/2',
          },
        ],
      },
      {
        title: [
          { kind: 'emphasis', text: 'Alex Chen' },
          { kind: 'text', text: ' started following you' },
        ],
        actionUrl: 'https://example.com/users/alex',
      },
    ],
  },
});

function NotificationDigestEmail({
  items,
}: NotificationDigestProps): React.ReactElement {
  return (
    <EmailLayout previewText={digestSubject(items)}>
      <Text
        variant="small"
        style={{ margin: 0, color: theme.colors.mutedForeground }}
      >
        You have {digestSubject(items)}
      </Text>

      {items.map((item, itemIndex) => (
        <Section
          key={itemIndex}
          spacing="none"
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            backgroundColor: theme.colors.muted,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius,
          }}
        >
          <Text style={{ margin: 0 }}>
            <SegmentsView segments={item.title} />
          </Text>
          {item.body && item.body.length > 0 ? (
            <Text
              style={{
                margin: '8px 0 0',
                color: theme.colors.mutedForeground,
              }}
            >
              <SegmentsView segments={item.body} />
            </Text>
          ) : null}
          {item.actionUrl ? (
            <Text style={{ margin: '12px 0 0' }}>
              <Link href={item.actionUrl}>View</Link>
            </Text>
          ) : null}
        </Section>
      ))}
    </EmailLayout>
  );
}
