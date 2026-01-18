// @ts-nocheck

import { Heading } from '$componentsHeading';
import { EmailLayout } from '$componentsLayout';
import { Text } from '$componentsText';
import { defineEmail } from '$typesEmailComponent';
import * as React from 'react';

interface TestEmailProps {
  name?: string;
}

export default defineEmail(TestEmail, {
  subject: 'Test Email',
  previewProps: {
    name: 'Test User',
  },
});

function TestEmail({ name }: TestEmailProps): React.ReactElement {
  return (
    <EmailLayout previewText="This is a test email">
      <Heading as="h2">Test Email</Heading>

      <Text>Hello{name ? ` ${name}` : ''}!</Text>

      <Text>This is a placeholder email template for testing purposes.</Text>
    </EmailLayout>
  );
}
