import * as React from 'react';

import { Button } from '../../components/button.js';
import { Heading } from '../../components/heading.js';
import { EmailLayout } from '../../components/layout.js';
import { Section } from '../../components/section.js';
import { Text } from '../../components/text.js';
import { theme } from '../../constants/theme.js';
import { defineEmail } from '../../types/email-component.types.js';

interface PostCommentedProps {
  commenterName: string;
  postTitle: string;
  /** The comment itself, quoted beneath the summary line. */
  excerpt?: string;
  actionUrl: string;
}

/**
 * A bespoke template for `post.commented`, demonstrating a per-type email
 * renderer: the same notification renders as a plain segment line in the feed
 * and as this layout in mail, both from the one channel-neutral `render`.
 *
 * Its subject is a function of props rather than a constant, so the channel
 * needs no subject override to get per-notification wording.
 */
export default defineEmail<PostCommentedProps>(PostCommentedEmail, {
  subject: ({ commenterName, postTitle }) =>
    `${commenterName} commented on ${postTitle}`,
  previewProps: {
    commenterName: 'Dana Mehta',
    postTitle: 'Hello World',
    excerpt: 'Looks great — shipping this today.',
    actionUrl: 'https://example.com/posts/1',
  },
});

function PostCommentedEmail({
  commenterName,
  postTitle,
  excerpt,
  actionUrl,
}: PostCommentedProps): React.ReactElement {
  return (
    <EmailLayout previewText={`${commenterName} commented on ${postTitle}`}>
      <Heading as="h2">New comment on your post</Heading>

      <Text>
        <strong style={{ fontWeight: theme.typography.weights.semibold }}>
          {commenterName}
        </strong>{' '}
        left a comment on{' '}
        <strong style={{ fontWeight: theme.typography.weights.semibold }}>
          {postTitle}
        </strong>
        .
      </Text>

      {excerpt ? (
        <Section
          spacing="none"
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: theme.colors.muted,
            borderLeft: `3px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius,
          }}
        >
          <Text style={{ margin: 0, color: theme.colors.mutedForeground }}>
            {excerpt}
          </Text>
        </Section>
      ) : null}

      <Section align="left" spacing="md">
        <Button href={actionUrl}>Read the comment</Button>
      </Section>
    </EmailLayout>
  );
}
