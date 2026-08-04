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
    actionUrl: 'https://example.com/posts/1',
  },
});

function PostCommentedEmail({
  commenterName,
  postTitle,
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

      <Section align="left" spacing="md">
        <Button href={actionUrl}>Read the comment</Button>
      </Section>
    </EmailLayout>
  );
}
