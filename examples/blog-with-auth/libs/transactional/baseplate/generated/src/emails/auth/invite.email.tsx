import * as React from 'react';

import { Button } from '../../components/button.js';
import { Divider } from '../../components/divider.js';
import { Heading } from '../../components/heading.js';
import { EmailLayout } from '../../components/layout.js';
import { Section } from '../../components/section.js';
import { Text } from '../../components/text.js';
import { theme } from '../../constants/theme.js';
import { defineEmail } from '../../types/email-component.types.js';

interface InviteProps {
  acceptLink: string;
}

export default defineEmail(InviteEmail, {
  subject: `You've been invited to ${theme.branding.name}`,
  previewProps: {
    acceptLink: 'https://example.com',
  },
});

function InviteEmail({ acceptLink }: InviteProps): React.ReactElement {
  return (
    <EmailLayout previewText={`You've been invited to ${theme.branding.name}`}>
      <Heading as="h2">You've been invited</Heading>

      <Text>
        You've been invited to join {theme.branding.name}. Click the button
        below to set your password and get started.
      </Text>

      <Section align="center">
        <Button href={acceptLink}>Accept Invite</Button>
      </Section>

      <Divider spacing="lg" />

      <Text variant="muted">
        If you weren't expecting this invite, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
