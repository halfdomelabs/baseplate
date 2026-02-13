import * as React from 'react';

import { Button } from '../../components/button.js';
import { Divider } from '../../components/divider.js';
import { Heading } from '../../components/heading.js';
import { EmailLayout } from '../../components/layout.js';
import { Section } from '../../components/section.js';
import { Text } from '../../components/text.js';
import { theme } from '../../constants/theme.js';
import { defineEmail } from '../../types/email-component.types.js';

interface AccountVerificationProps {
  verifyLink: string;
}

export default defineEmail(AccountVerificationEmail, {
  subject: `Verify your ${theme.branding.name} email address`,
  previewProps: {
    verifyLink: 'https://example.com',
  },
});

function AccountVerificationEmail({
  verifyLink,
}: AccountVerificationProps): React.ReactElement {
  return (
    <EmailLayout
      previewText={`Verify your ${theme.branding.name} email address`}
    >
      <Heading as="h2">Verify your email</Heading>
      <Text>
        Thanks for signing up for {theme.branding.name}! Please verify your
        email address to get started.
      </Text>
      (
      <>
        <Text>
          Click the button below to confirm your email. This link will expire in
          24 hours.
        </Text>

        <Section align="center">
          <Button href={verifyLink}>Verify Email</Button>
        </Section>
      </>
      <Divider spacing="lg" />
      <Text variant="muted">
        If you didn't create an account with {theme.branding.name}, you can
        safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
