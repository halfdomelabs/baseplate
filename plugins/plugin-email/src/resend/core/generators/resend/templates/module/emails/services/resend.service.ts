// @ts-nocheck

import type { EmailAdapter } from '%emailModuleImports';

import { config } from '%configServiceImports';
import { Resend } from 'resend';

let resendClient: Resend | undefined;

/**
 * Gets the Resend client, creating it lazily on first use.
 */
function getResendClient(): Resend {
  resendClient ??= new Resend(config.RESEND_API_KEY);
  return resendClient;
}

export const resendEmailAdapter: EmailAdapter = {
  name: 'resend',
  sendMail: async (message) => {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: message.from,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        contentId: attachment.cid,
      })),
      headers: message.headers,
    });

    if (error) {
      throw new Error(
        `Resend error (${error.name}, status ${String(error.statusCode)}): ${error.message}`,
      );
    }

    return data.id;
  },
};
