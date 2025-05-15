import { describe, expect, it } from 'vitest';

import {
  convertHexToOklch,
  convertOklchToHex,
  parseOklch,
} from './color-conversions.js';

describe('Color Conversion Utilities', () => {
  describe('parseOklch', () => {
    it('should parse a valid OKLCH color string', () => {
      const result = parseOklch('oklch(0.5 0.2 180)');
      expect(result).toEqual({
        mode: 'oklch',
        l: 0.5,
        c: 0.2,
        h: 180,
      });
    });

    it('should parse a valid OKLCH color string with alpha', () => {
      const result = parseOklch('oklch(0.5 0.2 180 / 0.3)');
      expect(result).toEqual({
        mode: 'oklch',
        l: 0.5,
        c: 0.2,
        h: 180,
        alpha: 0.3,
      });
    });

    it('should throw an error for invalid OKLCH color string', () => {
      expect(() => parseOklch('invalid')).toThrow(
        'Invalid OKLCH color string: invalid',
      );
    });
  });

  describe('convertOklchToHex', () => {
    it('should convert OKLCH string to hex', () => {
      const result = convertOklchToHex('oklch(0.5 0.2 180)');
      expect(result).toBe('#008368');
    });

    it('should convert OKLCH object to hex', () => {
      const result = convertOklchToHex({
        mode: 'oklch',
        l: 0.5,
        c: 0.2,
        h: 180,
      });
      expect(result).toBe('#008368');
    });
  });

  describe('convertHexToOklch', () => {
    it('should convert hex to OKLCH string', () => {
      const result = convertHexToOklch('#7a7a7a');
      expect(result).toMatch(/^oklch\([\d.]+ [\d.]+ [\d.]+\)$/);
    });

    it('should handle hex with alpha', () => {
      const result = convertHexToOklch('#7a7a7a80');
      expect(result).toBe('oklch(0.580 0.000 0/ 0.502)');
    });
  });
});
