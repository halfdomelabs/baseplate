import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isDirectoryEmpty,
  removeEmptyAncestorDirectories,
} from './directories.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('directories', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('isDirectoryEmpty', () => {
    it('should return true for empty directory', async () => {
      vol.mkdirSync('/empty-dir');

      const result = await isDirectoryEmpty('/empty-dir');
      expect(result).toBe(true);
    });

    it('should return false for directory with files', async () => {
      vol.fromJSON({
        '/non-empty-dir/file.txt': 'content',
      });

      const result = await isDirectoryEmpty('/non-empty-dir');
      expect(result).toBe(false);
    });

    it('should return false when directory does not exist', async () => {
      const result = await isDirectoryEmpty('/non-existent-dir');
      expect(result).toBe(false);
    });

    it('should return true when directory only contains ignored files', async () => {
      vol.fromJSON({
        '/dir-with-ignored/.gitkeep': '',
        '/dir-with-ignored/.DS_Store': '',
      });

      const result = await isDirectoryEmpty('/dir-with-ignored', {
        ignoreFiles: ['.gitkeep', '.DS_Store'],
      });
      expect(result).toBe(true);
    });

    it('should return false when directory contains both ignored and non-ignored files', async () => {
      vol.fromJSON({
        '/mixed-dir/.gitkeep': '',
        '/mixed-dir/important.txt': 'content',
      });

      const result = await isDirectoryEmpty('/mixed-dir', {
        ignoreFiles: ['.gitkeep'],
      });
      expect(result).toBe(false);
    });

    it('should handle empty ignoreFiles array', async () => {
      vol.fromJSON({
        '/test-dir/file.txt': 'content',
      });

      const result = await isDirectoryEmpty('/test-dir', { ignoreFiles: [] });
      expect(result).toBe(false);
    });
  });

  describe('removeEmptyAncestorDirectories', () => {
    it('should remove empty ancestor directories', async () => {
      // Setup: Create file structure
      vol.fromJSON({
        '/root/level1/level2/level3/file.txt': 'content',
      });

      // Simulate file deletion using memfs directly
      vol.unlinkSync('/root/level1/level2/level3/file.txt');

      // Test: Remove empty directories
      await removeEmptyAncestorDirectories(
        ['/root/level1/level2/level3/file.txt'],
        '/root',
      );

      // Assert: Directories should be removed
      const files = vol.toJSON();
      expect(files['/root/level1/level2/level3/file.txt']).toBeUndefined();
      expect(files['/root/level1/level2/level3/']).toBeUndefined();
      expect(files['/root/level1/level2/']).toBeUndefined();
      expect(files['/root/level1/']).toBeUndefined();
      expect(vol.existsSync('/root')).toBe(true);
    });

    it('should stop at specified directory', async () => {
      // Setup: Create file structure
      vol.fromJSON({
        '/root/level1/level2/level3/file.txt': 'content',
      });

      // Simulate file deletion using memfs directly
      vol.unlinkSync('/root/level1/level2/level3/file.txt');

      // Test: Remove empty directories with stop point
      await removeEmptyAncestorDirectories(
        ['/root/level1/level2/level3/file.txt'],
        '/root/level1',
      );

      // Assert: Should stop at level1
      const files = vol.toJSON();
      expect(files['/root/level1/level2/level3/file.txt']).toBeUndefined();
      expect(vol.existsSync('/root/level1/level2/level3/')).toBe(false);
      expect(vol.existsSync('/root/level1/level2/')).toBe(false);
      expect(vol.existsSync('/root/level1/')).toBe(true); // Should not be removed
    });

    it('should not remove directories that are not empty', async () => {
      // Setup: Create file structure with multiple files
      vol.fromJSON({
        '/root/level1/level2/level3/file1.txt': 'content1',
        '/root/level1/level2/level3/file2.txt': 'content2',
      });

      // Simulate deletion of only one file using memfs directly
      vol.unlinkSync('/root/level1/level2/level3/file1.txt');

      // Test: Remove empty directories
      await removeEmptyAncestorDirectories(
        ['/root/level1/level2/level3/file1.txt'],
        '/root',
      );

      // Assert: Directory should not be removed because it still has file2.txt
      const files = vol.toJSON();
      expect(files['/root/level1/level2/level3/file1.txt']).toBeUndefined();
      expect(files['/root/level1/level2/level3/file2.txt']).toBe('content2');
      expect(vol.existsSync('/root/level1/level2/level3/')).toBe(true); // Should not be removed
    });

    it('should handle multiple file paths', async () => {
      // Setup: Create file structure
      vol.fromJSON({
        '/root/level1/level2/file1.txt': 'content1',
        '/root/level1/level2/file2.txt': 'content2',
      });

      // Simulate deletion of both files using memfs directly
      vol.unlinkSync('/root/level1/level2/file1.txt');
      vol.unlinkSync('/root/level1/level2/file2.txt');

      // Test: Remove empty directories
      await removeEmptyAncestorDirectories(
        ['/root/level1/level2/file1.txt', '/root/level1/level2/file2.txt'],
        '/root',
      );

      // Assert: Directories should be removed
      const files = vol.toJSON();
      expect(files['/root/level1/level2/file1.txt']).toBeUndefined();
      expect(files['/root/level1/level2/file2.txt']).toBeUndefined();
      expect(files['/root/level1/level2/']).toBeUndefined();
      expect(files['/root/level1/']).toBeUndefined();
    });

    it('should remove directories that only contain ignored files', async () => {
      // Setup: Create file structure with ignored files
      vol.fromJSON({
        '/root/level1/level2/level3/file.txt': 'content',
        '/root/level1/level2/.gitkeep': '',
      });

      // Simulate file deletion using memfs directly
      vol.unlinkSync('/root/level1/level2/level3/file.txt');

      // Test: Remove empty directories with ignoreFiles
      await removeEmptyAncestorDirectories(
        ['/root/level1/level2/level3/file.txt'],
        '/root',
        { ignoreFiles: ['.gitkeep'] },
      );

      // Assert: level3 should be removed, and level2 should also be removed (including .gitkeep)
      const files = vol.toJSON();
      expect(files['/root/level1/level2/level3/file.txt']).toBeUndefined();
      expect(files['/root/level1/level2/.gitkeep']).toBeUndefined(); // Should be removed with directory
      expect(vol.existsSync('/root/level1/level2/level3/')).toBe(false); // Should be removed
      expect(vol.existsSync('/root/level1/level2/')).toBe(false); // Should be removed (only contained ignored files)
    });

    it('should handle non-existent directories gracefully', async () => {
      await expect(
        removeEmptyAncestorDirectories(['/non/existent/file.txt'], '/root'),
      ).resolves.not.toThrow();
    });
  });
});
