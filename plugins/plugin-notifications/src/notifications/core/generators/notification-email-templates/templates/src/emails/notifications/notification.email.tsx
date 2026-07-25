// @ts-nocheck

import {
  Button,
  defineEmail,
  EmailLayout,
  Link,
  Section,
  Text,
  theme,
} from '%transactionalLibImports';
import * as React from 'react';
import { Column, Row } from 'react-email';

/**
 * A rendered content segment, mirroring the notification module's segment IR.
 * Kept structural so the email renders the same text/link formatting the in-app
 * feed shows.
 */
type NotificationEmailSegment =
  | { type: 'text'; value: string; bold?: boolean }
  | { type: 'link'; value: string; href: string };

interface NotificationProps {
  /** The actor's display name. Absent = a system notification. */
  actorName?: string;
  /** Structured content segments. Falls back to `body` when empty. */
  segments?: NotificationEmailSegment[];
  /** Plain-text rendering, used for the subject and when `segments` is empty. */
  body: string;
  /** Where the notification points, if any. Rendered as a button. */
  actionUrl?: string;
}

/** Two-letter initials from a name, e.g. "Dana Mehta" -> "DM". */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts.at(0)?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * Avatar circle with initials — the actor's when present, otherwise the brand's
 * (system notifications). Initials render identically across every mail client,
 * unlike an emoji or icon font.
 */
function NotificationAvatar({
  actorName,
}: {
  actorName?: string;
}): React.ReactElement {
  const isActor = actorName !== undefined;
  const initials = getInitials(actorName ?? theme.branding.name);
  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '9999px',
        backgroundColor: isActor ? theme.colors.primary : theme.colors.muted,
        color: isActor
          ? theme.colors.primaryForeground
          : theme.colors.mutedForeground,
        fontSize: '14px',
        fontWeight: theme.typography.weights.semibold,
        lineHeight: '40px',
        textAlign: 'center',
      }}
    >
      {initials}
    </div>
  );
}

/** Render one content segment (text — optionally bold — or a link). */
function SegmentView({
  segment,
}: {
  segment: NotificationEmailSegment;
}): React.ReactElement {
  if (segment.type === 'link') {
    return <Link href={segment.href}>{segment.value}</Link>;
  }
  return segment.bold ? (
    <strong style={{ fontWeight: theme.typography.weights.semibold }}>
      {segment.value}
    </strong>
  ) : (
    <>{segment.value}</>
  );
}

/**
 * The default notification email. A notification type can supply its own
 * component instead of this one when it needs bespoke copy or layout.
 */
export default defineEmail<NotificationProps>(NotificationEmail, {
  subject: ({ body }) => body,
  previewProps: {
    actorName: 'Dana Mehta',
    segments: [
      { type: 'text', value: 'Dana Mehta', bold: true },
      { type: 'text', value: ' commented on your post ' },
      {
        type: 'link',
        value: 'Hello World',
        href: 'https://example.com/posts/1',
      },
    ],
    body: 'Dana Mehta commented on your post Hello World',
    actionUrl: 'https://example.com/posts/1',
  },
});

function NotificationEmail({
  actorName,
  segments,
  body,
  actionUrl,
}: NotificationProps): React.ReactElement {
  const hasSegments = segments !== undefined && segments.length > 0;
  const heading = actorName
    ? `You received a notification from ${actorName}`
    : 'You have a new notification';
  return (
    <EmailLayout previewText={body}>
      <Row>
        <Column style={{ width: '40px', verticalAlign: 'middle' }}>
          <NotificationAvatar actorName={actorName} />
        </Column>
        <Column style={{ paddingLeft: '12px', verticalAlign: 'middle' }}>
          <Text
            variant="small"
            style={{ margin: 0, color: theme.colors.mutedForeground }}
          >
            {heading}
          </Text>
        </Column>
      </Row>

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
          {hasSegments
            ? segments.map((segment, index) => (
                <SegmentView key={index} segment={segment} />
              ))
            : body}
        </Text>
      </Section>

      {actionUrl ? (
        <Section align="left" spacing="md">
          <Button href={actionUrl}>View</Button>
        </Section>
      ) : null}
    </EmailLayout>
  );
}
