import { describe, expect, it } from 'vitest';

import { convertCaseWithPrefix } from './convert-case-with-prefix.js';

// Simple case conversion functions for testing
const kebabCase = (str: string): string =>
  str.replaceAll(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const camelCase = (str: string): string =>
  str.replaceAll(/[-_](.)/g, (_, char: string) => char.toUpperCase());
const snakeCase = (str: string): string =>
  str.replaceAll(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
const pascalCase = (str: string): string => {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

describe('convertCaseWithPrefix', () => {
  describe('with kebabCase converter', () => {
    it('converts normal strings to kebab-case', () => {
      // Arrange
      const input = 'layoutTest';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('layout-test');
    });

    it('preserves underscore prefix and converts middle part', () => {
      // Arrange
      const input = '_layoutTest';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('_layout-test');
    });

    it('preserves double underscore prefix and converts middle part', () => {
      // Arrange
      const input = '__privateHelper';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('__private-helper');
    });

    it('preserves suffix and converts middle part', () => {
      // Arrange
      const input = 'layoutTest_';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('layout-test_');
    });

    it('preserves both prefix and suffix', () => {
      // Arrange
      const input = '_layoutTest_';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('_layout-test_');
    });

    it('handles multiple non-alphanumeric characters in prefix', () => {
      // Arrange
      const input = '___layoutTest';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('___layout-test');
    });

    it('handles multiple non-alphanumeric characters in suffix', () => {
      // Arrange
      const input = 'layoutTest___';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('layout-test___');
    });

    it('handles mixed non-alphanumeric characters in prefix', () => {
      // Arrange
      const input = '_-$layoutTest';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('_-$layout-test');
    });

    it('handles mixed non-alphanumeric characters in suffix', () => {
      // Arrange
      const input = 'layoutTest_-$';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('layout-test_-$');
    });
  });

  describe('with camelCase converter', () => {
    it('converts normal strings to camelCase', () => {
      // Arrange
      const input = 'layout_test';

      // Act
      const result = convertCaseWithPrefix(input, camelCase);

      // Assert
      expect(result).toBe('layoutTest');
    });

    it('preserves prefix and converts middle part', () => {
      // Arrange
      const input = '_layout_test';

      // Act
      const result = convertCaseWithPrefix(input, camelCase);

      // Assert
      expect(result).toBe('_layoutTest');
    });

    it('preserves suffix and converts middle part', () => {
      // Arrange
      const input = 'layout_test_';

      // Act
      const result = convertCaseWithPrefix(input, camelCase);

      // Assert
      expect(result).toBe('layoutTest_');
    });
  });

  describe('with snakeCase converter', () => {
    it('converts normal strings to snake_case', () => {
      // Arrange
      const input = 'layoutTest';

      // Act
      const result = convertCaseWithPrefix(input, snakeCase);

      // Assert
      expect(result).toBe('layout_test');
    });

    it('preserves prefix and converts middle part', () => {
      // Arrange
      const input = '_layoutTest';

      // Act
      const result = convertCaseWithPrefix(input, snakeCase);

      // Assert
      expect(result).toBe('_layout_test');
    });
  });

  describe('with pascalCase converter', () => {
    it('converts normal strings to PascalCase', () => {
      // Arrange
      const input = 'layout_test';

      // Act
      const result = convertCaseWithPrefix(input, pascalCase);

      // Assert
      expect(result).toBe('LayoutTest');
    });

    it('preserves prefix and converts middle part', () => {
      // Arrange
      const input = '_layout_test';

      // Act
      const result = convertCaseWithPrefix(input, pascalCase);

      // Assert
      expect(result).toBe('_LayoutTest');
    });
  });

  describe('edge cases', () => {
    it('returns input unchanged when entire string is non-alphanumeric', () => {
      // Arrange
      const input = '[id]';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('[id]');
    });

    it('returns input unchanged when entire string is non-alphanumeric with multiple characters', () => {
      // Arrange
      const input = '_-$@#';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('_-$@#');
    });

    it('handles empty string', () => {
      // Arrange
      const input = '';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('');
    });

    it('handles string with only alphanumeric characters', () => {
      // Arrange
      const input = 'testString';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('test-string');
    });

    it('handles string with only non-alphanumeric characters in middle', () => {
      // Arrange
      const input = 'test___string';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('test___string');
    });

    it('handles complex mixed case scenarios', () => {
      // Arrange
      const input = '___MyComponentName___';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('___my-component-name___');
    });

    it('handles numbers in the string', () => {
      // Arrange
      const input = '_test123String';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('_test123string');
    });

    it('handles special characters like brackets', () => {
      // Arrange
      const input = '[testString]';

      // Act
      const result = convertCaseWithPrefix(input, kebabCase);

      // Assert
      expect(result).toBe('[test-string]');
    });
  });
});
