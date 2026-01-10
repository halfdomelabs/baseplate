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
  verifyLink?: string;
  verifyCode?: string;
}

export default defineEmail(AccountVerificationEmail, {
  subject: 'Verify your email address',
  previewProps: {
    verifyLink: 'https://example.com',
    verifyCode: '123456',
  },
});

function AccountVerificationEmail({
  verifyLink,
  verifyCode,
}: AccountVerificationProps): React.ReactElement {
  return (
    <EmailLayout previewText="Verify your email address">
      <Heading as="h2">Verify your email</Heading>

      <Text>
        Thanks for signing up for Baseplate! Please verify your email address to
        get started.
      </Text>

      {verifyCode && (
        <>
          <Text>
            To complete your registration, please use the 6-digit code below.
            This code will expire in 15 minutes.
          </Text>

          <Section align="center" spacing="md">
            <table cellPadding={0} cellSpacing={8} style={styles.codeContainer}>
              <tbody>
                <tr>
                  {/* eslint-disable-next-line @typescript-eslint/no-misused-spread -- verification codes are ASCII digits only */}
                  {[...verifyCode].map((digit, index) => (
                    <td key={index} style={styles.codeDigit}>
                      {digit}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Section>
        </>
      )}

      {verifyLink && (
        <>
          <Text>
            Click the button below to confirm your email. This link will expire
            in 24 hours.
          </Text>

          <Section align="center">
            <Button href={verifyLink}>Verify Email</Button>
          </Section>
        </>
      )}

      <Divider spacing="lg" />

      <Text variant="muted">
        If you didn't create an account with Baseplate, you can safely ignore
        this email.
      </Text>
    </EmailLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  codeContainer: {
    margin: '0 auto',
    borderSpacing: '8px',
  },
  codeDigit: {
    width: '36px',
    height: '44px',
    backgroundColor: theme.colors.muted,
    borderRadius: '6px',
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.fontFamily,
    color: theme.colors.foreground,
    textAlign: 'center',
    verticalAlign: 'middle',
  },
};
