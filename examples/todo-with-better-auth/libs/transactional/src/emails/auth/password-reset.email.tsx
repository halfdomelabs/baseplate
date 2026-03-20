import * as React from 'react';

import { Button } from '../../components/button.js';
import { Divider } from '../../components/divider.js';
import { Heading } from '../../components/heading.js';
import { EmailLayout } from '../../components/layout.js';
import { Section } from '../../components/section.js';
import { Text } from '../../components/text.js';
import { theme } from '../../constants/theme.js';
import { defineEmail } from '../../types/email-component.types.js';

interface PasswordResetProps {
  resetLink: string;
}

export default defineEmail(PasswordResetEmail, {
  subject: `Reset your ${theme.branding.name} password`,
  previewProps: {
    resetLink: 'https://example.com',
  },
});

function PasswordResetEmail({
  resetLink,
}: PasswordResetProps): React.ReactElement {
  return (
    <EmailLayout previewText={`Reset your ${theme.branding.name} password`}>
      <Heading as="h2">Reset your password</Heading>

      <Text>
        We received a request to reset the password for your{' '}
        {theme.branding.name} account.
      </Text>

      <Text>
        To choose a new password, click the button below. This link will expire
        in 1 hour for your security.
      </Text>

      <Section align="center">
        <Button href={resetLink}>Reset Password</Button>
      </Section>

      <Divider spacing="lg" />

      <Text variant="muted">
        If you didn't request this email, you can safely ignore it. Your account
        will remain secure.
      </Text>
    </EmailLayout>
  );
}
