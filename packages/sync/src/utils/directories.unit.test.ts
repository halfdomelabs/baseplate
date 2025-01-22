import { vol } from 'memfs';
import fs from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isDirectoryEmpty,
  removeEmptyAncestorDirectories,
} from './directories.js';

// Mock the fs module
vi.mock('node:fs');
vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('directory cleanup functions', () => {
  describe('isDirectoryEmpty', () => {
    it('should return true for empty directory', async () => {
      // Setup
      vol.mkdirSync('/empty');

      // Test
      const result = await isDirectoryEmpty('/empty');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-empty directory', async () => {
      // Setup
      vol.mkdirSync('/nonempty');
      vol.writeFileSync('/nonempty/file.txt', 'content');

      // Test
      const result = await isDirectoryEmpty('/nonempty');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for non-existent directory', async () => {
      const result = await isDirectoryEmpty('/nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('removeEmptyAncestorDirectories', () => {
    it('should remove empty parent directories', async () => {
      // Setup
      const filePath = '/root/empty1/empty2/file.txt';
      vol.fromJSON({
        [filePath]: 'content',
      });
      await fs.unlink(filePath);

      // Test
      await removeEmptyAncestorDirectories([filePath], '/root');

      // Assert
      expect(vol.existsSync('/root/empty1/empty2')).toBe(false);
      expect(vol.existsSync('/root/empty1')).toBe(false);
      expect(vol.existsSync('/root')).toBe(true);
    });

    it('should stop at non-empty directories', async () => {
      // Setup
      const filePath = '/root/dir1/empty/file1.txt';
      vol.fromJSON({
        [filePath]: 'content',
        '/root/dir1/other-file.txt': 'content',
      });

      await fs.unlink(filePath);

      // Test
      await removeEmptyAncestorDirectories([filePath], '/root');

      // Assert
      expect(vol.existsSync('/root/dir1/empty')).toBe(false);
      expect(vol.existsSync('/root/dir1')).toBe(true);
      expect(vol.existsSync('/root')).toBe(true);
    });

    it('should stop at specified stopAt directory', async () => {
      // Setup
      const filePath = '/root/dir1/empty/file1.txt';
      vol.fromJSON({
        [filePath]: 'content',
      });
      await fs.unlink(filePath);

      // Test
      await removeEmptyAncestorDirectories([filePath], '/root/dir1');

      // Assert
      expect(vol.existsSync('/root/dir1/empty')).toBe(false);
      expect(vol.existsSync('/root/dir1')).toBe(true);
    });

    it('should handle multiple file paths', async () => {
      // Setup
      vol.fromJSON({
        '/root/dir1/empty1/file1.txt': 'content',
        '/root/dir2/empty2/file2.txt': 'content',
        '/root/dir3/empty3/file3.txt': 'content',
        '/root/dir3/other-file.txt': 'content',
      });

      const filePaths = [
        '/root/dir1/empty1/file1.txt',
        '/root/dir2/empty2/file2.txt',
        '/root/dir3/empty3/file3.txt',
      ];

      for (const filePath of filePaths) {
        await fs.unlink(filePath);
      }

      // Test
      await removeEmptyAncestorDirectories(filePaths, '/root');

      // Assert
      expect(vol.existsSync('/root/dir1/empty1')).toBe(false);
      expect(vol.existsSync('/root/dir2/empty2')).toBe(false);
      expect(vol.existsSync('/root/dir3/empty3')).toBe(false);
      expect(vol.existsSync('/root/dir1')).toBe(false);
      expect(vol.existsSync('/root/dir2')).toBe(false);
      expect(vol.existsSync('/root/dir3')).toBe(true);
      expect(vol.existsSync('/root')).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Setup
      vol.fromJSON({
        '/root/dir1/empty/file1.txt': 'content',
      });

      // Mock fs.rmdir to throw an error
      const mockReaddir = vi.spyOn(fs, 'readdir');
      mockReaddir.mockRejectedValueOnce(new Error('Permission denied'));

      const filePath = '/root/dir1/empty/file1.txt';
      await fs.unlink(filePath);

      // Test
      await expect(
        removeEmptyAncestorDirectories([filePath], '/root'),
      ).resolves.not.toThrow();

      // Assert
      expect(mockReaddir).toHaveBeenCalled();
    });
  });
});
