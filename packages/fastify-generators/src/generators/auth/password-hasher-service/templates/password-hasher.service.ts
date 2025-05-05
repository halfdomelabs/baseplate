// @ts-nocheck

import { Algorithm, hash, Options, verify } from '@node-rs/argon2';

// Using recommendations from https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
const DEFAULT_ARGON_OPTIONS: Options = {
  memoryCost: 19456,
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
  hashed: string,
  password: string,
): Promise<boolean> {
  return verify(hashed, password);
}
