// @ts-nocheck

import type {
  EmailAdapter,
  EmailRawOptions,
  EmailSendOptions,
  EmailTransport,
  TransformedEmailMessage,
} from '$emailsTypes';
import type { QueueService } from '%queuesImports';
import type { ServiceContextWith } from '%serviceContextImports';

import { sendEmailQueue } from '$sendEmailQueue';
import { config } from '%configServiceImports';

function normalizeEmailAddresses(addresses: string | string[]): string[] {
  return Array.isArray(addresses) ? addresses : [addresses];
}

function buildTransformedMessage(
  options: EmailRawOptions,
): TransformedEmailMessage {
  return {
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
  };
}

async function renderEmailComponent<P extends object>(
  component: TPL_EMAIL_COMPONENT<P>,
  data: P,
): Promise<{ html: string; text: string; subject: string }> {
  try {
    return await TPL_RENDER_EMAIL(component, data);
  } catch (error) {
    throw new Error(`Failed to render email template: ${component.name}`, {
      cause: error,
    });
  }
}

/**
 * Producer-side email capability: renders a message and enqueues it for
 * delivery. Rendering happens here, before enqueue - once queued, the
 * message format is frozen and the worker only delivers it (`emailTransport`).
 */
export interface EmailService {
  /**
   * Sends a raw email (no React rendering) using the email queue.
   *
   * @param options - The options for sending the email.
   * @returns The job ID of the email job.
   */
  sendRaw(options: EmailRawOptions): Promise<string | undefined>;

  /**
   * Renders an email component and sends it using the email queue.
   *
   * @param component - The email component to render (must be created with defineEmail).
   * @param options - The options for sending the email, including data props.
   * @returns The job ID of the email job.
   */
  send<P extends object>(
    component: TPL_EMAIL_COMPONENT<P>,
    options: { data: P } & EmailSendOptions,
  ): Promise<string | undefined>;
}

/**
 * Creates the {@link EmailService}. Construction allocates no resources -
 * enqueueing is deferred to `queues`, itself already constructed.
 *
 * @param deps - Construction dependencies
 * @param deps.queues - The queue service to enqueue the send-email job with.
 * @returns The email service
 */
export function createEmailService({
  queues,
}: {
  queues: QueueService;
}): EmailService {
  async function sendRaw(
    options: EmailRawOptions,
  ): Promise<string | undefined> {
    return queues.enqueue(sendEmailQueue, {
      message: buildTransformedMessage(options),
      template: options.template,
    });
  }

  async function send<P extends object>(
    component: TPL_EMAIL_COMPONENT<P>,
    options: { data: P } & EmailSendOptions,
  ): Promise<string | undefined> {
    const rendered = await renderEmailComponent(component, options.data);
    return sendRaw({
      subject: rendered.subject,
      ...options,
      html: rendered.html,
      text: rendered.text,
      template: component.displayName,
    });
  }

  return { sendRaw, send };
}

/**
 * Renders an email component and sends it, via `ctx.services.emails`. The
 * primary authoring surface for feature code holding a `ServiceContext`.
 *
 * @param ctx - The service context, providing access to `services.emails`.
 * @param component - The email component to render (must be created with defineEmail).
 * @param options - The options for sending the email, including data props.
 * @returns The job ID of the email job.
 */
export async function sendEmail<P extends object>(
  ctx: ServiceContextWith<'emails'>,
  component: TPL_EMAIL_COMPONENT<P>,
  options: { data: P } & EmailSendOptions,
): Promise<string | undefined> {
  return ctx.services.emails.send(component, options);
}

/**
 * Wraps an {@link EmailAdapter} as an {@link EmailTransport}. Construction
 * allocates no resources - the adapter's own client (if any) is created
 * lazily by the adapter itself.
 *
 * @param adapter - The configured email adapter (e.g. Postmark).
 * @returns The email transport
 */
export function createEmailTransport(adapter: EmailAdapter): EmailTransport {
  return {
    deliver: (message) => adapter.sendMail(message),
  };
}
