import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dirExists } from './dir-exists.js';

vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('dirExists', () => {
  it('should return true if the directory exists', async () => {
    // Arrange
    const dirPath = '/test';
    vol.fromJSON({
      [`${dirPath}/test.txt`]: 'test',
    });

    // Act
    const result = await dirExists(dirPath);

    // Assert
    expect(result).toBe(true);
  });

  it('should return false if the file does not exist', async () => {
    // Arrange
    const filePath = '/test';

    // Act
    const result = await dirExists(filePath);

    // Assert
    expect(result).toBe(false);
  });

  it('should return false if the path is a file', async () => {
    // Arrange
    const filePath = '/test/test.txt';
    vol.fromJSON({
      [filePath]: 'test',
    });

    // Act
    const result = await dirExists(filePath);

    // Assert
    expect(result).toBe(false);
  });
});
