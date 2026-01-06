import type { EnqueueOptions } from '@src/types/queue.types.js';

/**
 * Configuration for sending an email, including queue behavior.
 */
export interface EmailSendOptions {
  /**
   * The recipient email address(es).
   */
  to: string | string[];

  /**
   * The subject line of the email. Defaults to the component's subject if omitted.
   */
  subject?: string;

  /**
   * The sender address. Defaults to the system default if omitted.
   */
  from?: string;

  /**
   * Carbon Copy recipients.
   */
  cc?: string | string[];

  /**
   * Blind Carbon Copy recipients.
   */
  bcc?: string | string[];

  /**
   * Reply-To address.
   */
  replyTo?: string | string[];

  /**
   * List of attachments for the email.
   */
  attachments?: EmailAttachment[];

  /**
   * Custom headers to send with the email (e.g., X-Entity-Ref-ID).
   */
  headers?: Record<string, string>;

  /**
   * Options passed directly to the underlying Queue.
   * Use this to schedule emails for later, set priority, or configure retries.
   */
  queue?: EnqueueOptions;
}

/**
 * Options for sending a raw email (no React rendering).
 */
export interface EmailRawOptions extends EmailSendOptions {
  /**
   * The HTML body of the email.
   */
  html: string;

  /**
   * The plain text body of the email.
   */
  text?: string;

  /**
   * The subject line of the email.
   */
  subject: string;

  /**
   * The name of the email component to use for rendering (if any).
   */
  template?: string;
}

/**
 * Represents a file attachment.
 */
export interface EmailAttachment {
  /**
   * The name of the file as it will appear in the email.
   */
  filename: string;

  /**
   * The content of the file. Can be a Buffer, Stream, or Base64 string.
   */
  content: string | Buffer;

  /**
   * The MIME type of the file (e.g., 'application/pdf').
   */
  contentType: string;

  /**
   * Content-ID for inline images.
   */
  cid?: string;
}

/**
 * The internal payload structure stored in the Queue.
 * This is what the Queue Worker receives and passes to the Adapter.
 */
export interface TransformedEmailMessage {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

/**
 * The contract that all Email Providers must implement.
 * (e.g., SesAdapter, SmtpAdapter, ResendAdapter)
 */
export interface EmailAdapter {
  /**
   * The unique identifier for this adapter.
   */
  name: string;

  /**
   * Performs the actual transmission of the email.
   * This is typically called by the Queue Worker, not the API handler directly.
   *
   * @param message The fully constructed and rendered email message.
   */
  sendMail(message: TransformedEmailMessage): Promise<string>;
}
