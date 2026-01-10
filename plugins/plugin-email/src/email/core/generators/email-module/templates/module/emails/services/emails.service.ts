// @ts-nocheck

import type { EmailRawOptions, EmailSendOptions } from '$emailsTypes';

import { sendEmailQueue } from '$sendEmailQueue';
import { config } from '%configServiceImports';

function normalizeEmailAddresses(addresses: string | string[]): string[] {
  return Array.isArray(addresses) ? addresses : [addresses];
}

/**
 * Sends a raw email using the email queue.
 *
 * @param options - The options for sending the email.
 * @returns The job ID of the email job.
 */
export async function sendRawEmail(
  options: EmailRawOptions,
): Promise<string | undefined> {
  return await sendEmailQueue.enqueue({
    message: {
      from: options.from ?? config.EMAIL_DEFAULT_FROM,
      to: normalizeEmailAddresses(options.to),
      cc: options.cc ? normalizeEmailAddresses(options.cc) : undefined,
      bcc: options.bcc ? normalizeEmailAddresses(options.bcc) : undefined,
      replyTo: options.replyTo
        ? normalizeEmailAddresses(options.replyTo)
        : undefined,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
      headers: options.headers,
    },
    template: options.template,
  });
}

/**
 * Renders an email component and sends it using the email queue.
 *
 * @param component - The email component to render (must be created with defineEmail).
 * @param options - The options for sending the email, including data props.
 * @returns The job ID of the email job.
 */
export async function sendEmail<P extends object>(
  component: TPL_EMAIL_COMPONENT<P>,
  options: { data: P } & EmailSendOptions,
): Promise<string | undefined> {
  let html: string;
  let text: string;
  let subject: string;

  try {
    const rendered = await TPL_RENDER_EMAIL(component, options.data);
    html = rendered.html;
    text = rendered.text;
    subject = rendered.subject;
  } catch (error) {
    throw new Error(`Failed to render email template: ${component.name}`, {
      cause: error,
    });
  }

  return sendRawEmail({
    subject,
    ...options,
    html,
    text,
    template: component.displayName,
  });
}
