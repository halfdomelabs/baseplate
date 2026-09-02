import { NotificationEmail } from '@blog-with-auth/transactional';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { QueueJob, QueueService } from '@src/types/queue.types.js';

import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';

import type { SendEmailJobData } from '../queues/send-email.queue.js';

import { sendEmailWorker } from '../queues/send-email.worker.js';
import {
  captureEmailAdapter,
  clearCapturedEmails,
  findLastCapturedEmail,
} from './capture.adapter.js';
import { createEmailService, createEmailTransport } from './email.service.js';

const RECIPIENT = 'reader@example.com';

/** Records what was enqueued rather than reaching a real backend. */
function createRecordingQueue(): QueueService & { jobs: SendEmailJobData[] } {
  const jobs: SendEmailJobData[] = [];
  return {
    jobs,
    enqueue: vi.fn((_token: unknown, data: SendEmailJobData) => {
      jobs.push(data);
      return Promise.resolve('job-1');
    }),
  } as unknown as QueueService & { jobs: SendEmailJobData[] };
}

/** The one job `send` enqueued, or a failure saying what was there instead. */
function onlyJob(jobs: readonly SendEmailJobData[]): SendEmailJobData {
  const [job, ...rest] = jobs;
  if (!job || rest.length > 0) {
    throw new Error(`Expected exactly one enqueued email, got ${jobs.length}`);
  }
  return job;
}

/**
 * Runs one enqueued job through the worker exactly as the backend would.
 *
 * The payload is round-tripped through JSON because that is what the queue
 * stores it as — anything that does not survive serialization never reaches the
 * adapter.
 */
async function deliverEnqueued(data: SendEmailJobData): Promise<void> {
  const job = {
    id: 'job-1',
    name: 'send-email',
    // eslint-disable-next-line unicorn/prefer-structured-clone -- models the queue's lossy JSON boundary
    data: JSON.parse(JSON.stringify(data)) as SendEmailJobData,
    attemptNumber: 1,
    maxAttempts: 1,
  } as QueueJob<SendEmailJobData>;

  await sendEmailWorker.invoke(
    job,
    createTestServiceContext({
      services: { emailTransport: createEmailTransport(captureEmailAdapter) },
    }),
  );
}

beforeEach(() => {
  clearCapturedEmails();
});

/**
 * The producer-to-provider path, which nothing else covers: mocking at the
 * `send` call site stops short of the queue, the worker and the adapter.
 */
describe('email delivery', () => {
  it('carries custom headers through the queue to the adapter', async () => {
    const queue = createRecordingQueue();
    const email = createEmailService({ queue });
    const unsubscribe =
      'https://api.example.com/notifications/unsubscribe?t=general.tok';

    await email.send(NotificationEmail, {
      to: RECIPIENT,
      headers: {
        'List-Unsubscribe': `<${unsubscribe}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      data: {
        subject: 'Alice commented',
        title: [{ kind: 'text', text: 'Alice commented' }],
      },
    });

    await deliverEnqueued(onlyJob(queue.jobs));

    // Set by the notification channel, read by the adapter, with a rendering
    // step and a JSON boundary in between.
    const captured = findLastCapturedEmail(RECIPIENT);
    expect(captured?.headers).toEqual({
      'List-Unsubscribe': `<${unsubscribe}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });

  it('delivers the rendered body and subject, not the props', async () => {
    const queue = createRecordingQueue();
    const email = createEmailService({ queue });

    await email.send(NotificationEmail, {
      to: RECIPIENT,
      data: {
        subject: 'Alice commented',
        title: [{ kind: 'text', text: 'Alice commented' }],
      },
    });

    await deliverEnqueued(onlyJob(queue.jobs));

    // Rendering happens before the enqueue, so the adapter receives HTML.
    const captured = findLastCapturedEmail(RECIPIENT);
    expect(captured?.subject).toBe('Alice commented');
    expect(captured?.html).toContain('Alice commented');
    expect(captured?.from).toBeTruthy();
  });

  it('captures nothing for an address that was not written to', () => {
    expect(findLastCapturedEmail('nobody@example.com')).toBeUndefined();
  });
});
