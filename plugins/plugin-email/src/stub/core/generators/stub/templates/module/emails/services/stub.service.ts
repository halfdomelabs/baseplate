// @ts-nocheck

import type {
  EmailAdapter,
  TransformedEmailMessage,
} from '%emailModuleImports';

import { logger } from '%loggerServiceImports';

/**
 * Stub email adapter for local development and as a starting point for custom providers.
 *
 * By default, this adapter logs emails to the console instead of sending them.
 *
 * TODO: Replace this stub with your own email provider implementation.
 * You only need to update the `sendMail` method to integrate with your provider's API.
 */
export const TPL_ADAPTER_NAME: EmailAdapter = {
  name: TPL_PROVIDER_NAME,
  sendMail: (message: TransformedEmailMessage): Promise<string> => {
    // TODO: Replace this with your email provider's send implementation.
    // The message object contains all the fields you need:
    //   - message.from: sender address
    //   - message.to: array of recipient addresses
    //   - message.subject: email subject
    //   - message.html: HTML body
    //   - message.text: plain text body (optional)
    //   - message.cc, message.bcc, message.replyTo: optional address arrays
    //   - message.attachments: optional file attachments
    //   - message.headers: optional custom headers

    logger.info(
      {
        from: message.from,
        to: message.to,
        subject: message.subject,
      },
      TPL_LOG_MESSAGE,
    );

    return Promise.resolve(`stub-${Date.now()}`);
  },
};
