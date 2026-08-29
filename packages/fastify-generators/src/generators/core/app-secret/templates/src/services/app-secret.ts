// @ts-nocheck

import { getConfig } from '%configServiceImports';
import * as crypto from 'node:crypto';

/** Matches SHA-256's output width, which HMAC-SHA256 keys off. */
const DERIVED_KEY_BYTES = 32;

const HASH = 'sha256';

/** Width of the key id a token carries. 2^48 ids, so collisions are not a concern. */
const KEY_ID_BYTES = 6;

/**
 * Derivation label for a secret's public id. Distinct from every caller purpose,
 * so the id published in a token is a derived value rather than a fingerprint of
 * the secret itself.
 */
const KEY_ID_PURPOSE = 'key-id';

/**
 * The secrets in play: the one that signs, and every one that may verify.
 *
 * Order is not load-bearing — a token names its key by id — so entries can be
 * reordered or removed freely. Removing one invalidates exactly the tokens it
 * signed and nothing else.
 */
function getSecrets(): { current: string; all: string[] } {
  const { APP_SECRET, APP_SECRET_PREVIOUS } = getConfig();
  const previous = APP_SECRET_PREVIOUS.split(',')
    .map((secret) => secret.trim())
    .filter((secret) => secret !== '');
  return { current: APP_SECRET, all: [APP_SECRET, ...previous] };
}

function deriveFrom(secret: string, purpose: string): Buffer {
  // No salt: `info` (the purpose) already provides the domain separation, and a
  // constant salt would add nothing a constant `info` does not.
  return Buffer.from(
    crypto.hkdfSync(HASH, secret, '', purpose, DERIVED_KEY_BYTES),
  );
}

/** A secret's public identifier, safe to carry in a token. */
function keyId(secret: string): string {
  return Buffer.from(
    crypto.hkdfSync(HASH, secret, '', KEY_ID_PURPOSE, KEY_ID_BYTES),
  ).toString('base64url');
}

/**
 * A key for one purpose, derived from the current app secret via HKDF.
 *
 * The purpose is a domain separator, so a key disclosed by one feature grants
 * nothing in another. Prefer {@link createSigner} for anything signed now and
 * verified later — it records which secret signed the token, which is what lets
 * the token survive rotation.
 *
 * @param purpose - Domain separator. Distinct purposes yield unrelated keys.
 * @returns The derived key.
 */
export function deriveKey(purpose: string): Buffer {
  return deriveFrom(getSecrets().current, purpose);
}

/**
 * Which secrets a signer will verify against.
 *
 * - `current` (the default) — `APP_SECRET` only, so rotating invalidates
 *   outstanding values immediately. For values that are cheap to reissue, such
 *   as session cookies.
 * - `all` — `APP_SECRET_PREVIOUS` too, indefinitely. For values that are mailed
 *   out and cannot be reissued, such as an unsubscribe link.
 */
export type SecretPolicy = 'current' | 'all';

/** Signs and verifies values under one purpose. */
export interface Signer<T> {
  sign(payload: T): string;
  /** Null if the token is malformed, forged, or signed by a rejected secret. */
  verify(token: string): T | null;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on a length mismatch, and a MAC is fixed-width, so
  // an unequal length only means malformed.
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/**
 * Creates a signer for one purpose.
 *
 * Tokens are `<key-id>.<payload>.<mac>`, with the MAC covering the key id, so
 * relabelling a token to point at another secret does not verify. Tokens carry
 * no expiry; a caller needing one puts it in the payload.
 *
 * A valid MAC proves this app minted the token, not that the payload still
 * matches `T`. Version the purpose (`...:v1`) and bump it whenever the payload
 * shape changes — the new purpose derives a new key, so tokens carrying the old
 * shape stop verifying. Where old tokens must survive a shape change, the caller
 * has to validate the returned object at runtime instead.
 *
 * @param purpose - Domain separator; see {@link deriveKey}.
 * @param options - Which secrets to accept on verify. Defaults to `current`.
 * @returns The signer.
 */
export function createSigner<T>(
  purpose: string,
  options?: { accept?: SecretPolicy },
): Signer<T> {
  const accept = options?.accept ?? 'current';

  function macOf(secret: string, signedPart: string): string {
    return crypto
      .createHmac(HASH, deriveFrom(secret, purpose))
      .update(signedPart)
      .digest('base64url');
  }

  return {
    sign(payload) {
      const { current } = getSecrets();
      const encoded = Buffer.from(JSON.stringify(payload)).toString(
        'base64url',
      );
      const signedPart = `${keyId(current)}.${encoded}`;
      return `${signedPart}.${macOf(current, signedPart)}`;
    },

    verify(token) {
      const [id, encoded, mac, ...rest] = token.split('.');
      if (
        id === undefined ||
        encoded === undefined ||
        mac === undefined ||
        rest.length > 0
      ) {
        return null;
      }

      const { current, all } = getSecrets();
      const secret = (accept === 'current' ? [current] : all).find(
        (candidate) => keyId(candidate) === id,
      );
      if (secret === undefined) return null;

      if (!safeEqual(mac, macOf(secret, `${id}.${encoded}`))) return null;

      try {
        return JSON.parse(
          Buffer.from(encoded, 'base64url').toString('utf8'),
        ) as T;
      } catch {
        // A valid MAC over an unparseable payload means the shape changed under
        // an unversioned purpose.
        return null;
      }
    },
  };
}
