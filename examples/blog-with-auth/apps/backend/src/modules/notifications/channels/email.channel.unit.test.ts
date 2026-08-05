import { NotificationDigestEmail } from '@blog-with-auth/transactional';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { EmailService } from '../../emails/services/email.service.js';
import type { AnyNotificationType } from '../registry.js';
import type { RenderSource } from '../services/notification-renderer.js';

import { defineNotificationType } from '../registry.js';
import { createNotificationRenderer } from '../services/notification-renderer.js';
import { createEmailChannel, notificationEmail } from './email.channel.js';

vi.mock('@src/services/error-logger.js', () => ({ logError: vi.fn() }));

/** A component stands in for a real template; only identity is asserted. */
const CommentEmail = Object.assign(() => null, {
  subject: 'Component subject',
  displayName: 'CommentEmail',
}) as unknown as Parameters<typeof notificationEmail>[0];

/** A type whose email is the generic wrapper built from `render`. */
const PLAIN_TYPE = defineNotificationType({
  key: 'test.plain',
  version: 1,
  topic: 'general',
  paramsSchema: z.object({ name: z.string() }),
  channels: ['email'],
  render: (params) => ({ title: `${params.name} commented` }),
});

/** The same, but declaring a bespoke email template for immediate sends. */
const OVERRIDE_TYPE = defineNotificationType({
  key: 'test.override',
  version: 1,
  topic: 'general',
  paramsSchema: z.object({ name: z.string() }),
  channels: ['email'],
  render: (params) => ({ title: `${params.name} commented` }),
  renderers: {
    email: (params) => notificationEmail(CommentEmail, { name: params.name }),
  },
});

function makeRow(type: string, name: string): RenderSource {
  return {
    id: `row-${type}-${name}`,
    type,
    templateVersion: 1,
    params: { name },
    frozenContent: { title: `${name} commented` },
  };
}

/** One send as the email service saw it. */
interface RecordedEmail {
  component: unknown;
  data: unknown;
  /** Only set when a renderer overrode the component's own subject. */
  subject: string | undefined;
  /**
   * Whether the key was present at all. The real `send` spreads these options
   * over the rendered subject, so a present-but-undefined `subject` silently
   * clears the component's own — a distinction the value alone cannot show.
   */
  hasSubjectKey: boolean;
}

/** An email service that records what was sent rather than sending it. */
function createRecordingEmail(): EmailService & { sent: RecordedEmail[] } {
  const sent: RecordedEmail[] = [];
  return {
    sent,
    send: vi.fn(
      (component: unknown, options: { data?: unknown; subject?: string }) => {
        sent.push({
          component,
          data: options.data,
          subject: options.subject,
          hasSubjectKey: 'subject' in options,
        });
        return Promise.resolve('message-id');
      },
    ),
    sendRaw: vi.fn(() => Promise.resolve('message-id')),
  };
}

function createChannel(types: AnyNotificationType[]): {
  channel: ReturnType<typeof createEmailChannel>;
  email: ReturnType<typeof createRecordingEmail>;
} {
  const email = createRecordingEmail();
  const renderer = createNotificationRenderer({ notificationTypes: types });
  return { channel: createEmailChannel({ email, renderer }), email };
}

const RECIPIENT = { email: 'someone@example.com' };

describe('email channel digests', () => {
  it('folds every row into one message, overrides included', async () => {
    const { channel, email } = createChannel([PLAIN_TYPE, OVERRIDE_TYPE]);

    await channel.deliverDigest?.({
      recipientId: 'user-1',
      notifications: [
        makeRow('test.plain', 'Alice'),
        makeRow('test.override', 'Bao'),
      ],
      recipient: RECIPIENT,
    });

    // The decision this locks in: a digest renders through `render`, never the
    // type's own email template. A bespoke template commits to being a whole
    // email, so honouring it here would hand back two messages for the one the
    // recipient asked for.
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.component).not.toBe(CommentEmail);
    expect(email.sent[0]?.data).toMatchObject({
      items: [
        { title: [{ kind: 'text', text: 'Alice commented' }] },
        { title: [{ kind: 'text', text: 'Bao commented' }] },
      ],
    });
  });

  it('still uses the override for an immediate send', async () => {
    const { channel, email } = createChannel([OVERRIDE_TYPE]);

    await channel.deliver({
      recipientId: 'user-1',
      notification: makeRow('test.override', 'Bao'),
      recipient: RECIPIENT,
    });

    // The override is an immediate-delivery affordance; digest is the mode
    // that trades it for one message.
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.component).toBe(CommentEmail);
    expect(email.sent[0]?.data).toEqual({ name: 'Bao' });
  });

  it('derives the subject from the item count, never a period name', () => {
    // Owned by the template rather than passed in: the window is a floor, not a
    // schedule, so a calendar word would promise a cadence the sweep misses.
    const subjectFor = NotificationDigestEmail.subject as (props: {
      items: unknown[];
    }) => string;

    expect(subjectFor({ items: [{}] })).toBe('1 new notification');
    expect(subjectFor({ items: [{}, {}, {}] })).toBe('3 new notifications');
  });

  it('sends nothing to a recipient with no address', async () => {
    const { channel, email } = createChannel([PLAIN_TYPE]);

    await channel.deliverDigest?.({
      recipientId: 'user-1',
      notifications: [makeRow('test.plain', 'Alice')],
      recipient: { email: null },
    });

    expect(email.sent).toHaveLength(0);
  });
});

/**
 * The per-channel override, exercised through the channel that owns it.
 *
 * Every one of these degrades to the generic wrapper rather than failing: a
 * broken bespoke template must never mean no email at all.
 */
describe('email channel per-type overrides', () => {
  it('sends the type’s own component when it declares one', async () => {
    const { channel, email } = createChannel([OVERRIDE_TYPE]);

    await channel.deliver({
      recipientId: 'user-1',
      notification: makeRow('test.override', 'Alice'),
      recipient: RECIPIENT,
    });

    expect(email.sent[0]?.component).toBe(CommentEmail);
    expect(email.sent[0]?.data).toEqual({ name: 'Alice' });
    // The key must be absent, not undefined: `send` spreads these options over
    // the rendered subject, so passing it would leave this email with none.
    expect(email.sent[0]?.hasSubjectKey).toBe(false);
  });

  it('falls back to the generic wrapper when the type declares none', async () => {
    const { channel, email } = createChannel([PLAIN_TYPE]);

    await channel.deliver({
      recipientId: 'user-1',
      notification: makeRow('test.plain', 'Alice'),
      recipient: RECIPIENT,
    });

    // Not a failure mode: a type without an override is the normal case.
    expect(email.sent[0]?.component).not.toBe(CommentEmail);
    expect(email.sent[0]?.data).toMatchObject({
      subject: 'Alice commented',
    });
  });

  it('falls back when the pinned renderer is gone', async () => {
    // Registry is empty, so the row's type cannot be resolved at all.
    const { channel, email } = createChannel([]);

    await channel.deliver({
      recipientId: 'user-1',
      notification: makeRow('test.override', 'Alice'),
      recipient: RECIPIENT,
    });

    // Renders from the frozen snapshot rather than dropping the email.
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.component).not.toBe(CommentEmail);
  });

  it('falls back when stored params no longer satisfy the schema', async () => {
    const { channel, email } = createChannel([OVERRIDE_TYPE]);

    await channel.deliver({
      recipientId: 'user-1',
      notification: {
        ...makeRow('test.override', 'Alice'),
        params: { wrongField: 1 },
      },
      recipient: RECIPIENT,
    });

    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.component).not.toBe(CommentEmail);
  });

  it('falls back — never throws — when the override itself throws', async () => {
    const throwingType = defineNotificationType({
      key: 'test.throws',
      version: 1,
      topic: 'general',
      paramsSchema: z.object({ name: z.string() }),
      channels: ['email'],
      render: (params) => ({ title: `${params.name} commented` }),
      renderers: {
        email: () => {
          throw new Error('template blew up');
        },
      },
    });
    const { channel, email } = createChannel([throwingType]);

    await channel.deliver({
      recipientId: 'user-1',
      notification: makeRow('test.throws', 'Alice'),
      recipient: RECIPIENT,
    });

    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.data).toMatchObject({ subject: 'Alice commented' });
  });

  it('passes a subject override through when the renderer sets one', async () => {
    const subjectType = defineNotificationType({
      key: 'test.subject',
      version: 1,
      topic: 'general',
      paramsSchema: z.object({ name: z.string() }),
      channels: ['email'],
      render: (params) => ({ title: params.name }),
      renderers: {
        email: (params) =>
          notificationEmail(
            CommentEmail,
            { name: params.name },
            { subject: `Re: ${params.name}` },
          ),
      },
    });
    const { channel, email } = createChannel([subjectType]);

    await channel.deliver({
      recipientId: 'user-1',
      notification: makeRow('test.subject', 'Alice'),
      recipient: RECIPIENT,
    });

    expect(email.sent[0]?.subject).toBe('Re: Alice');
  });
});
