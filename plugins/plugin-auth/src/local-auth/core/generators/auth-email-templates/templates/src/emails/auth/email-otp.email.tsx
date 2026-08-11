// @ts-nocheck

import {
  defineEmail,
  Divider,
  EmailLayout,
  Heading,
  Section,
  Text,
  theme,
} from '%transactionalLibImports';
import * as React from 'react';

interface EmailOtpProps {
  code: string;
  expiryMinutes: number;
}

export default defineEmail(EmailOtpEmail, {
  // Code first: inbox lists and notification previews truncate early, so many
  // users never need to open the message. It also makes each resend visually
  // distinct in clients that collapse threads by subject.
  subject: ({ code }) => `${code} is your ${theme.branding.name} sign-in code`,
  previewProps: {
    code: '123456',
    expiryMinutes: 10,
  },
});

function EmailOtpEmail({
  code,
  expiryMinutes,
}: EmailOtpProps): React.ReactElement {
  return (
    <EmailLayout previewText={`Your ${theme.branding.name} sign-in code`}>
      <Heading as="h2">Your sign-in code</Heading>
      <Text>
        Enter this code to finish signing in to {theme.branding.name}.
      </Text>

      <Section align="center">
        <Text>
          <strong style={{ fontSize: '28px', letterSpacing: '6px' }}>
            {code}
          </strong>
        </Text>
      </Section>

      <Text>This code expires in {expiryMinutes} minutes.</Text>
      <Divider spacing="lg" />
      <Text variant="muted">
        If you didn&apos;t request this code, you can safely ignore this email.
        Someone may have typed your email address by mistake.
      </Text>
    </EmailLayout>
  );
}
