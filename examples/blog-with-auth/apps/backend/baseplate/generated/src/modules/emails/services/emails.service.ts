import { config } from '@src/services/config.js';

import type { EmailRawOptions } from '../emails.types.js';

import { sendEmailQueue } from '../queues/send-email.queue.js';

function normalizeEmailAddresses(addresses: string | string[]): string[] {
  return Array.isArray(addresses) ? addresses : [addresses];
}

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

// -------------------------------------------------------------------------------------------------
// Disabled until we implement transaction package

// /**
//  * Renders an email component and sends it using the email queue.
//  *
//  * @param component - The email component to render (must be created with defineEmail).
//  * @param options - The options for sending the email, including data props.
//  * @returns The job ID of the email job.
//  */
// export async function sendEmail<P extends object>(
//   component: EmailComponent<P>,
//   options: { data: P } & EmailSendOptions,
// ): Promise<string | undefined> {
//   let html: string;
//   let text: string;
//   let subject: string;

//   try {
//     const rendered = await renderEmail(component, options.data);
//     html = rendered.html;
//     text = rendered.text;
//     subject = rendered.subject;
//   } catch (error) {
//     throw new Error(`Failed to render email template: ${component.name}`, {
//       cause: error,
//     });
//   }

//   return sendRawEmail({
//     subject,
//     ...options,
//     html,
//     text,
//     template: component.name,
//   });
// }
