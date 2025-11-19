import { describe, expect, it } from 'vitest';

import { lowercaseFirstChar, uppercaseFirstChar } from './case.js';

describe('case utilities', () => {
  describe('lowercaseFirstChar', () => {
    it('lowercases the first character of a normal word', () => {
      // Arrange
      const input = 'HelloWorld';

      // Act
      const result = lowercaseFirstChar(input);

      // Assert
      expect(result).toBe('helloWorld');
    });

    it('returns the same string if already lowercased first char', () => {
      const input = 'helloWorld';
      const result = lowercaseFirstChar(input);
      expect(result).toBe('helloWorld');
    });

    it('handles empty string', () => {
      const input = '';
      const result = lowercaseFirstChar(input);
      expect(result).toBe('');
    });

    it('leaves non-alphabetic first characters unchanged', () => {
      const input = '1World';
      const result = lowercaseFirstChar(input);
      expect(result).toBe('1World');
    });

    it('handles unicode characters (emoji) at start', () => {
      const input = '😀Smile';
      const result = lowercaseFirstChar(input);
      expect(result).toBe('😀Smile');
    });
  });

  describe('uppercaseFirstChar', () => {
    it('uppercases the first character of a normal word', () => {
      const input = 'helloWorld';
      const result = uppercaseFirstChar(input);
      expect(result).toBe('HelloWorld');
    });

    it('returns the same string if already uppercased first char', () => {
      const input = 'HelloWorld';
      const result = uppercaseFirstChar(input);
      expect(result).toBe('HelloWorld');
    });

    it('handles empty string', () => {
      const input = '';
      const result = uppercaseFirstChar(input);
      expect(result).toBe('');
    });

    it('leaves non-alphabetic first characters unchanged', () => {
      const input = '#tag';
      const result = uppercaseFirstChar(input);
      expect(result).toBe('#tag');
    });

    it('handles unicode characters (emoji) at start', () => {
      const input = '😀smile';
      const result = uppercaseFirstChar(input);
      expect(result).toBe('😀smile');
    });
  });
});
