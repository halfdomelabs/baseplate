// @ts-nocheck

import {
  defineEmail,
  Divider,
  EmailLayout,
  Heading,
  Text,
  theme,
} from '%transactionalLibImports';
import * as React from 'react';

export default defineEmail(PasswordChangedEmail, {
  subject: `Your ${theme.branding.name} password has been changed`,
  previewProps: {},
});

function PasswordChangedEmail(): React.ReactElement {
  return (
    <EmailLayout
      previewText={`Your ${theme.branding.name} password has been changed`}
    >
      <Heading as="h2">Password changed</Heading>

      <Text>
        Your {theme.branding.name} account password has been successfully
        changed.
      </Text>

      <Text>
        If you made this change, no further action is needed. If you did not
        change your password, please contact support immediately and secure your
        account.
      </Text>

      <Divider spacing="lg" />

      <Text variant="muted">
        This is an automated security notification. You received this email
        because a password change was made on your account.
      </Text>
    </EmailLayout>
  );
}
