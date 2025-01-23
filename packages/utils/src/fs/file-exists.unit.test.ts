import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileExists } from './file-exists.js';

vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('fileExists', () => {
  it('should return true if the file exists', async () => {
    // Arrange
    const filePath = '/test.txt';
    vol.fromJSON({
      [filePath]: 'test',
    });

    // Act
    const result = await fileExists(filePath);

    // Assert
    expect(result).toBe(true);
  });

  it('should return false if the file does not exist', async () => {
    // Arrange
    const filePath = '/test.txt';

    // Act
    const result = await fileExists(filePath);

    // Assert
    expect(result).toBe(false);
  });

  it('should return false if the file is a directory', async () => {
    // Arrange
    const filePath = '/test';
    vol.fromJSON({
      [`${filePath}/test.txt`]: 'test',
    });

    // Act
    const result = await fileExists(filePath);

    // Assert
    expect(result).toBe(false);
  });
});
