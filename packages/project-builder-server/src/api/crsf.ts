import crypto from 'node:crypto';

let csrfToken: string | undefined;

export function getCsrfToken(): string {
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return csrfToken;
}
