import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSigner, deriveKey } from './app-secret.js';

const config = { APP_SECRET: '', APP_SECRET_PREVIOUS: '' };

vi.mock('./config.js', () => ({ getConfig: () => config }));

const FIRST_SECRET = 'first-secret-with-at-least-32-characters';
const SECOND_SECRET = 'second-secret-with-at-least-32-character';
const THIRD_SECRET = 'third-secret-with-at-least-32-characters';

/** Retires the current secret and installs a new one, as a real rotation would. */
function rotateTo(secret: string): void {
  config.APP_SECRET_PREVIOUS = [config.APP_SECRET, config.APP_SECRET_PREVIOUS]
    .filter(Boolean)
    .join(',');
  config.APP_SECRET = secret;
}

beforeEach(() => {
  config.APP_SECRET = FIRST_SECRET;
  config.APP_SECRET_PREVIOUS = '';
});

describe('deriveKey', () => {
  it('is stable for a purpose and unrelated across purposes', () => {
    expect(deriveKey('a:v1')).toEqual(deriveKey('a:v1'));
    expect(deriveKey('a:v1')).not.toEqual(deriveKey('b:v1'));
  });

  it('follows the current secret across a rotation', () => {
    const before = deriveKey('a:v1');
    rotateTo(SECOND_SECRET);
    expect(deriveKey('a:v1')).not.toEqual(before);
  });
});

describe('createSigner', () => {
  it('round-trips a payload', () => {
    const signer = createSigner<{ userId: string }>('a:v1');
    expect(signer.verify(signer.sign({ userId: 'u1' }))).toEqual({
      userId: 'u1',
    });
  });

  it('rejects a tampered payload', () => {
    const signer = createSigner<{ userId: string }>('a:v1');
    const [id, , mac] = signer.sign({ userId: 'u1' }).split('.');
    const forged = Buffer.from(JSON.stringify({ userId: 'u2' })).toString(
      'base64url',
    );

    expect(signer.verify(`${id}.${forged}.${mac}`)).toBeNull();
  });

  it('rejects a token signed under a different purpose', () => {
    const token = createSigner<{ userId: string }>('a:v1').sign({
      userId: 'u1',
    });

    expect(createSigner<{ userId: string }>('b:v1').verify(token)).toBeNull();
  });

  it.each([['no-dots'], ['a.b'], ['unknownid.payload.mac'], ['a.b.c.d']])(
    'rejects the malformed token %s',
    (token) => {
      expect(createSigner<{ userId: string }>('a:v1').verify(token)).toBeNull();
    },
  );

  it('defaults to accepting only the current secret', () => {
    const token = createSigner<{ userId: string }>('a:v1').sign({
      userId: 'u1',
    });

    rotateTo(SECOND_SECRET);

    expect(createSigner<{ userId: string }>('a:v1').verify(token)).toBeNull();
  });

  describe('after APP_SECRET is rotated', () => {
    it('still verifies an older token under the "all" policy', () => {
      const signer = createSigner<{ userId: string }>('a:v1', {
        accept: 'all',
      });
      const token = signer.sign({ userId: 'u1' });

      rotateTo(SECOND_SECRET);

      expect(signer.verify(token)).toEqual({ userId: 'u1' });
    });

    it('still verifies the oldest token after two rotations', () => {
      const signer = createSigner<{ userId: string }>('a:v1', {
        accept: 'all',
      });
      const first = signer.sign({ userId: 'u1' });

      rotateTo(SECOND_SECRET);
      const second = signer.sign({ userId: 'u2' });
      rotateTo(THIRD_SECRET);

      expect(signer.verify(first)).toEqual({ userId: 'u1' });
      expect(signer.verify(second)).toEqual({ userId: 'u2' });
    });

    it('is unaffected by the order of APP_SECRET_PREVIOUS', () => {
      const signer = createSigner<{ userId: string }>('a:v1', {
        accept: 'all',
      });
      const token = signer.sign({ userId: 'u1' });

      rotateTo(SECOND_SECRET);
      rotateTo(THIRD_SECRET);
      // A token names its key by id, so shuffling the retired list changes
      // nothing — the failure mode an index-based scheme would have had.
      config.APP_SECRET_PREVIOUS = config.APP_SECRET_PREVIOUS.split(',')
        .toReversed()
        .join(',');

      expect(signer.verify(token)).toEqual({ userId: 'u1' });
    });

    it('invalidates only the tokens of a secret that is removed', () => {
      const signer = createSigner<{ userId: string }>('a:v1', {
        accept: 'all',
      });
      const fromFirst = signer.sign({ userId: 'u1' });

      rotateTo(SECOND_SECRET);
      const fromSecond = signer.sign({ userId: 'u2' });
      rotateTo(THIRD_SECRET);

      config.APP_SECRET_PREVIOUS = SECOND_SECRET;

      expect(signer.verify(fromFirst)).toBeNull();
      expect(signer.verify(fromSecond)).toEqual({ userId: 'u2' });
    });
  });
});
