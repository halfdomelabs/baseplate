import { describe, expect, it } from 'vitest';

import { doubleQuot, quot } from './quot.js';

describe('quot', () => {
  it('wraps a normal string in single quotes', () => {
    // Arrange
    const input = 'hello';

    // Act
    const result = quot(input);

    // Assert
    expect(result).toBe("'hello'");
  });

  it('escapes single quotes in the string', () => {
    // Arrange
    const input = "it's fine";

    // Act
    const result = quot(input);

    // Assert
    expect(result).toBe(String.raw`'it\'s fine'`);
  });

  it('handles multiple single quotes', () => {
    // Arrange
    const input = "he's 'here'";

    // Act
    const result = quot(input);

    // Assert
    expect(result).toBe(String.raw`'he\'s \'here\''`);
  });

  it('handles empty string', () => {
    // Arrange
    const input = '';

    // Act
    const result = quot(input);

    // Assert
    expect(result).toBe("''");
  });
});

describe('doubleQuot', () => {
  it('wraps a normal string in double quotes', () => {
    // Arrange
    const input = 'hello';

    // Act
    const result = doubleQuot(input);

    // Assert
    expect(result).toBe('"hello"');
  });

  it('escapes double quotes in the string', () => {
    // Arrange
    const input = 'it"s fine';

    // Act
    const result = doubleQuot(input);

    // Assert
    expect(result).toBe(String.raw`"it\"s fine"`);
  });
});
