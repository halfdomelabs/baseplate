import { describe, expect, it } from 'vitest';

import { handleFileNotFoundError } from './handle-not-found-error.js';

describe('handleFileNotFoundError', () => {
  it('should return undefined for ENOENT errors', () => {
    // Arrange
    const enoentError = new Error('File not found') as NodeJS.ErrnoException;
    enoentError.code = 'ENOENT';

    // Act
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- we want to test the return value
    const result = handleFileNotFoundError(enoentError);

    // Assert
    expect(result).toBeUndefined();
  });

  it('should rethrow non-ENOENT errors', () => {
    // Arrange
    const otherError = new Error('Some other error');

    // Act & Assert
    expect(() => {
      handleFileNotFoundError(otherError);
    }).toThrow(otherError);
  });

  it('should rethrow if error is not an instance of Error', () => {
    // Arrange
    const invalidError = null;

    // Act & Assert
    expect(() => {
      handleFileNotFoundError(invalidError);
    }).toThrow();
  });
});
