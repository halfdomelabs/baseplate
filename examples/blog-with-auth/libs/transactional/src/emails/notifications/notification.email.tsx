import * as React from 'react';

import type { NotificationEmailSegment } from './segment-view.js';

import { Button } from '../../components/button.js';
import { EmailLayout } from '../../components/layout.js';
import { Section } from '../../components/section.js';
import { Text } from '../../components/text.js';
import { theme } from '../../constants/theme.js';
import { defineEmail } from '../../types/email-component.types.js';
import { SegmentsView } from './segment-view.js';

interface NotificationProps {
  /** The subject line, flattened to plain text by the caller. */
  subject: string;
  /** The headline, as segments. */
  title: NotificationEmailSegment[];
  /** Optional detail shown beneath the title. */
  body?: NotificationEmailSegment[];
  /** Where the notification points, if any. Rendered as a button. */
  actionUrl?: string;
}

/**
 * The default notification email. A notification type can supply its own
 * component instead of this one when it needs bespoke copy or layout.
 */
export default defineEmail<NotificationProps>(NotificationEmail, {
  subject: ({ subject }) => subject,
  previewProps: {
    subject: 'Dana Mehta commented on your post Hello World',
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
});

function NotificationEmail({
  subject,
  title,
  body,
  actionUrl,
}: NotificationProps): React.ReactElement {
  return (
    <EmailLayout previewText={subject}>
      <Text
        variant="small"
        style={{ margin: 0, color: theme.colors.mutedForeground }}
      >
        You have a new notification
      </Text>

      <Section
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
          <SegmentsView segments={title} />
        </Text>
        {body && body.length > 0 ? (
          <Text
            style={{
              margin: '8px 0 0',
              color: theme.colors.mutedForeground,
            }}
          >
            <SegmentsView segments={body} />
          </Text>
        ) : null}
      </Section>

      {actionUrl ? (
        <Section align="left" spacing="md">
          <Button href={actionUrl}>View</Button>
        </Section>
      ) : null}
    </EmailLayout>
  );
}
