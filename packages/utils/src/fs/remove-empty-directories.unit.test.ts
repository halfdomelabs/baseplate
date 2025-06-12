import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { removeEmptyDirectories } from './remove-empty-directories.js';

vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('removeEmptyDirectories', () => {
  it('should remove empty directory', async () => {
    // Arrange
    vol.fromJSON({
      '/test/empty-dir': null,
    });

    // Act
    await removeEmptyDirectories('/test');

    // Assert
    const files = vol.toJSON();
    expect(files['/test/empty-dir']).toBeUndefined();
  });

  it('should not remove directory with files', async () => {
    // Arrange
    vol.fromJSON({
      '/test/dir-with-file/file.txt': 'content',
    });

    // Act
    await removeEmptyDirectories('/test');

    // Assert
    const files = vol.toJSON();
    expect(files['/test/dir-with-file/file.txt']).toBe('content');
  });

  it('should recursively remove nested empty directories', async () => {
    // Arrange
    vol.fromJSON({
      '/test/nested/empty1/empty2': null,
    });

    // Act
    await removeEmptyDirectories('/test');

    // Assert
    const files = vol.toJSON();
    expect(files['/test/nested/empty1/empty2']).toBeUndefined();
    expect(files['/test/nested/empty1']).toBeUndefined();
    expect(files['/test/nested']).toBeUndefined();
  });
});
