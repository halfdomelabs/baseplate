import * as crypto from 'node:crypto';

/**
 * Cookie signing utilities
 * Based on node-cookie-signature by TJ Holowaychuk
 * Source: https://github.com/tj/node-cookie-signature
 */

/**
 * Sign the given `val` with `secret` using HMAC-SHA256.
 *
 * @param val - The value to sign.
 * @param secret - The secret key to use for signing.
 * @returns The signed value.
 */
export function sign(val: string, secret: string): string {
  return `${val}.${crypto
    .createHmac('sha256', secret)
    .update(val)
    .digest('base64')
    // remove all equal signs since they are not valid in cookie values
    .replaceAll('=', '')}`;
}

/**
 * Unsign and decode the given `input` with `secret`,
 *
 * @param input - The signed cookie string to unsign.
 * @param secret - The secret key used for signing.
 * @returns The unsigned value or undefined if the signature is invalid.
 */
export function unsign(input: string, secret: string): string | undefined {
  const tentativeValue = input.slice(0, input.lastIndexOf('.'));
  const expectedInput = sign(tentativeValue, secret);
  const expectedBuffer = Buffer.from(expectedInput);
  const inputBuffer = Buffer.from(input);
  if (
    expectedBuffer.length !== inputBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, inputBuffer)
  ) {
    return undefined;
  }
  return tentativeValue;
}

/**
 * Sign an object by JSON stringifying and base64 encoding it, then signing with secret.
 *
 * @param obj - The object to sign.
 * @param secret - The secret key to use for signing.
 * @returns The signed encoded object.
 */
export function signObject(obj: unknown, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(obj)).toString('base64url');
  return sign(encoded, secret);
}

/**
 * Unsign and decode an object that was signed with signObject.
 *
 * @param input - The signed encoded object string to unsign.
 * @param secret - The secret key used for signing.
 * @returns The decoded object or undefined if the signature is invalid.
 */
export function unsignObject(input: string, secret: string): unknown {
  const unsigned = unsign(input, secret);
  if (!unsigned) return undefined;

  try {
    const decoded = Buffer.from(unsigned, 'base64url').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return undefined;
  }
}
