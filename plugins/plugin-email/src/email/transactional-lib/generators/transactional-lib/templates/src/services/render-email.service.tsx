// @ts-nocheck

import type { EmailComponent } from '$typesEmailComponent';

import { render, toPlainText } from '@react-email/components';

/**
 * Renders an email component to HTML and plain text.
 *
 * @param Component - The email component to render (must be created with defineEmail).
 * @param props - The props to pass to the email component.
 * @returns The rendered HTML, plain text, and subject line.
 */
export async function renderEmail<P extends object>(
  Component: EmailComponent<P>,
  props: P,
): Promise<{
  html: string;
  text: string;
  subject: string;
}> {
  const html = await render(<Component {...props} />);
  const text = toPlainText(html);
  const subject =
    typeof Component.subject === 'function'
      ? Component.subject(props)
      : Component.subject;

  return {
    html,
    text,
    subject,
  };
}
