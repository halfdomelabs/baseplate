// @ts-nocheck

import type { EmailAdapter } from '%emailModuleImports';

import { config } from '%configServiceImports';
import { Models, ServerClient } from 'postmark';

let postmarkClient: ServerClient | undefined;

/**
 * Gets the Postmark client, creating it lazily on first use.
 */
function getPostmarkClient(): ServerClient {
  postmarkClient ??= new ServerClient(config.POSTMARK_SERVER_TOKEN);
  return postmarkClient;
}

export const postmarkEmailAdapter: EmailAdapter = {
  name: 'postmark',
  sendMail: async (message) => {
    const client = getPostmarkClient();
    const response = await client.sendEmail({
      From: message.from,
      To: message.to.join(', '),
      Cc: message.cc?.join(', '),
      Bcc: message.bcc?.join(', '),
      ReplyTo: message.replyTo?.join(', '),
      Subject: message.subject,
      HtmlBody: message.html,
      TextBody: message.text,
      Attachments: message.attachments?.map(
        (attachment) =>
          new Models.Attachment(
            attachment.filename,
            typeof attachment.content === 'string'
              ? attachment.content
              : attachment.content.toString('base64'),
            attachment.contentType,
            attachment.cid,
          ),
      ),
      Headers: Object.entries(message.headers ?? {}).map(
        ([name, value]) => new Models.Header(name, value),
      ),
    });

    return response.MessageID;
  },
};
