// @ts-nocheck
import { hash, verify, argon2id } from 'argon2';

export const hasherService = {
  async hash(password: string): Promise<string> {
    return hash(password, { type: argon2id });
  },
  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return verify(hashedPassword, password);
  },
};
