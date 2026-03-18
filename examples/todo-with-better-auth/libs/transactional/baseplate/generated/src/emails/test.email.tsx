import * as React from 'react';

import { Heading } from '../components/heading.js';
import { EmailLayout } from '../components/layout.js';
import { Text } from '../components/text.js';
import { defineEmail } from '../types/email-component.types.js';

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
