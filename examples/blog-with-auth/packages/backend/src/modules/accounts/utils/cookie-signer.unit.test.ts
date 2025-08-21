import { describe, expect, it } from 'vitest';

import { sign, signObject, unsign, unsignObject } from './cookie-signer.js';

describe('cookie-signer', () => {
  const secret = 'test-secret-key';

  describe('sign', () => {
    it('should sign a string value', () => {
      const value = 'test-value';
      const signed = sign(value, secret);
      expect(signed).toBeDefined();
      expect(signed).toContain(value);
      expect(signed).toContain('.');
    });
  });

  describe('unsign', () => {
    it('should unsign a valid signed value', () => {
      const value = 'test-value';
      const signed = sign(value, secret);
      const unsigned = unsign(signed, secret);
      expect(unsigned).toBe(value);
    });

    it('should return undefined for invalid signature', () => {
      const value = 'test-value';
      const signed = sign(value, secret);
      const tampered = `${signed}tampered`;
      expect(unsign(tampered, secret)).toBeUndefined();
    });

    it('should return undefined for malformed input', () => {
      expect(unsign('invalid', secret)).toBeUndefined();
    });
  });

  describe('signObject', () => {
    it('should sign an object', () => {
      const obj = { test: 'value', num: 123 };
      const signed = signObject(obj, secret);
      expect(signed).toBeDefined();
      expect(signed).toContain('.');
    });

    it('should produce different signatures for different objects', () => {
      const obj1 = { test: 'value1' };
      const obj2 = { test: 'value2' };
      expect(signObject(obj1, secret)).not.toBe(signObject(obj2, secret));
    });
  });

  describe('unsignObject', () => {
    it('should unsign and parse a valid signed object', () => {
      const obj = { test: 'value', num: 123 };
      const signed = signObject(obj, secret);
      const unsigned = unsignObject(signed, secret);
      expect(unsigned).toEqual(obj);
    });

    it('should return undefined for invalid signature', () => {
      const obj = { test: 'value' };
      const signed = signObject(obj, secret);
      const tampered = `${signed}tampered`;
      expect(unsignObject(tampered, secret)).toBeUndefined();
    });

    it('should return undefined for malformed JSON', () => {
      const invalidJson = Buffer.from('invalid-json').toString('base64url');
      const signed = sign(invalidJson, secret);
      expect(unsignObject(signed, secret)).toBeUndefined();
    });
  });
});
