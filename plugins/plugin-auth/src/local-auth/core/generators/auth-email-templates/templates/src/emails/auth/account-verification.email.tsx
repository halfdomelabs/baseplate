// @ts-nocheck

import {
  Button,
  defineEmail,
  Divider,
  EmailLayout,
  Heading,
  Section,
  Text,
  theme,
} from '%transactionalLibImports';
import * as React from 'react';

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
