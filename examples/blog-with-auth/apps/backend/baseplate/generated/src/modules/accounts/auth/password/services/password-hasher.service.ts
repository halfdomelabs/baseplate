import type { Options } from '@node-rs/argon2';

import { Algorithm, hash, verify } from '@node-rs/argon2';

import { logError } from '@src/services/error-logger.js';

// Using recommendations from https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
const DEFAULT_ARGON_OPTIONS: Options = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  algorithm: Algorithm.Argon2id,
};

export async function createPasswordHash(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password is required');
  }
  return hash(password, DEFAULT_ARGON_OPTIONS);
}

export async function verifyPasswordHash(
  hashed: string | null | undefined,
  password: string,
): Promise<boolean> {
  if (!hashed) {
    return false;
  }
  // argon2 throws on a hash string it cannot parse, e.g. one stored by another
  // algorithm, so treat an unreadable hash as a failed match rather than a crash
  try {
    return await verify(hashed, password);
  } catch (error) {
    logError(error, { source: 'verify-password-hash' });
    return false;
  }
}
