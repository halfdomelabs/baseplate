import { describe, expect, it } from 'vitest';

import { setConfigValue } from './config.js';

describe('setConfigValue', (): void => {
  it('sets a top-level key without mutating original', (): void => {
    // Arrange
    const original = { a: 1, b: 2 };

    // Act
    const result = setConfigValue(original, ['c'], 3);

    // Assert
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
    expect(original).toEqual({ a: 1, b: 2 });
  });

  it('sets a nested key and preserves other branches', (): void => {
    // Arrange
    const original = {
      sync: { editor: 'vscode', writeGeneratorStepsJson: false },
    };

    // Act
    const result = setConfigValue(original, ['sync', 'editor'], 'code');

    // Assert
    expect(result).toEqual({
      sync: { editor: 'code', writeGeneratorStepsJson: false },
    });
    expect(original).toEqual({
      sync: { editor: 'vscode', writeGeneratorStepsJson: false },
    });
  });

  it('creates intermediate objects if path does not exist', (): void => {
    // Arrange
    const original: Record<string, unknown> = {};

    // Act
    const result = setConfigValue(original, ['new', 'nested', 'key'], true);

    // Assert
    expect(result).toEqual({ new: { nested: { key: true } } });
    expect(original).toEqual({});
  });
});
