// @ts-nocheck

import type { EmailAdapter, TransformedEmailMessage } from '$emailTypes';

/** A message the capture adapter accepted, with the id it handed back. */
export interface CapturedEmail extends TransformedEmailMessage {
  messageId: string;
}

const captured: CapturedEmail[] = [];

/**
 * Records outgoing mail in memory instead of sending it, so a test can read the
 * message a provider would have received rather than mock the send call.
 *
 * In-process only: the store is module state, so a test driving the app in a
 * separate process sees an empty list.
 */
export const captureEmailAdapter: EmailAdapter = {
  name: 'capture',
  sendMail: (message: TransformedEmailMessage): Promise<string> => {
    const messageId = `capture-${String(captured.length + 1)}`;
    captured.push({ ...message, messageId });
    return Promise.resolve(messageId);
  },
};

/** Everything captured so far, oldest first. */
export function getCapturedEmails(): readonly CapturedEmail[] {
  return captured;
}

/** Drops the captured mail. Call between tests; nothing evicts on its own. */
export function clearCapturedEmails(): void {
  captured.length = 0;
}

/**
 * The most recent message sent to an address.
 *
 * @param to - Recipient address to match, against any of a message's addressees.
 * @returns The newest matching message, or undefined if there is none.
 */
export function findLastCapturedEmail(to: string): CapturedEmail | undefined {
  return captured.findLast((message) => message.to.includes(to));
}
