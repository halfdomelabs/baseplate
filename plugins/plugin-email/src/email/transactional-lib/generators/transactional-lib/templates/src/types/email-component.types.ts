// @ts-nocheck

import type * as React from 'react';

/**
 * A typed email component with required metadata.
 * Use `defineEmail` to create components that satisfy this interface.
 */
export interface EmailComponent<P extends object> {
  (props: P): React.ReactElement;
  subject: string | ((props: P) => string);
  name: string;
  /**
   * Preview props for React Email dev server.
   */
  PreviewProps?: P;
}

/**
 * Options for defining an email component.
 */
export interface DefineEmailOptions<P extends object> {
  /**
   * The subject line for the email.
   */
  subject: string | ((props: P) => string);
  /**
   * Preview props for React Email dev server.
   */
  previewProps?: P;
  /**
   * The name of the email component. Defaults to the function name.
   */
  name?: string;
}

/**
 * Creates a typed email component with required metadata.
 *
 * @example
 * ```tsx
 * export const WelcomeEmail = defineEmail(
 *   function WelcomeEmail({ name }: { name: string }) {
 *     return <EmailLayout subject="Welcome!">Hello {name}</EmailLayout>;
 *   },
 *   { subject: 'Welcome!', PreviewProps: { name: 'John Doe' } },
 * );
 * ```
 */
export function defineEmail<P extends object>(
  component: (props: P) => React.ReactElement,
  options: DefineEmailOptions<P>,
): EmailComponent<P> {
  const emailComponent = component as EmailComponent<P>;
  emailComponent.subject = options.subject;
  emailComponent.name = options.name ?? component.name;
  emailComponent.PreviewProps = options.previewProps;
  return emailComponent;
}
