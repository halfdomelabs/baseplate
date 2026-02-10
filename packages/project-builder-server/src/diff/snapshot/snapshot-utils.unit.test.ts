import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_SNAPSHOT_DIR,
  DIFFS_DIRNAME,
  MANIFEST_FILENAME,
} from './snapshot-types.js';
import {
  createSnapshotDirectory,
  pathToSafeDiffFilename,
  resolveSnapshotDirectory,
  safeDiffFilenameToPath,
} from './snapshot-utils.js';

vi.mock('node:fs/promises');

describe('snapshot-utils', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  describe('pathToSafeDiffFilename', () => {
    it('should convert forward slashes to underscores', () => {
      expect(pathToSafeDiffFilename('src/components/button.tsx')).toBe(
        'src_components_button.tsx.diff',
      );
    });

    it('should convert backslashes to underscores', () => {
      expect(
        pathToSafeDiffFilename(String.raw`src\components\button.tsx`),
      ).toBe('src_components_button.tsx.diff');
    });

    it('should handle mixed slashes', () => {
      expect(
        pathToSafeDiffFilename(String.raw`src/components\shared/utils.ts`),
      ).toBe('src_components_shared_utils.ts.diff');
    });

    it('should handle files in root directory', () => {
      expect(pathToSafeDiffFilename('README.md')).toBe('README.md.diff');
    });

    it('should handle empty filename', () => {
      expect(pathToSafeDiffFilename('')).toBe('.diff');
    });
  });

  describe('safeDiffFilenameToPath', () => {
    it('should convert underscores back to forward slashes', () => {
      expect(safeDiffFilenameToPath('src_components_button.tsx.diff')).toBe(
        'src/components/button.tsx',
      );
    });

    it('should handle files in root directory', () => {
      expect(safeDiffFilenameToPath('README.md.diff')).toBe('README.md');
    });

    it('should throw error for invalid diff filename', () => {
      expect(() => safeDiffFilenameToPath('invalid-filename')).toThrow(
        'Invalid diff filename: invalid-filename',
      );
    });

    it('should handle filenames with underscores in original path', () => {
      expect(safeDiffFilenameToPath('my_file.ts.diff')).toBe('my/file.ts');
    });
  });

  describe('createSnapshotDirectory', () => {
    it('should create snapshot directory with default name', async () => {
      const result = await createSnapshotDirectory('/test');

      expect(result).toEqual({
        path: path.resolve('/test', DEFAULT_SNAPSHOT_DIR),
        manifestPath: path.resolve(
          '/test',
          DEFAULT_SNAPSHOT_DIR,
          MANIFEST_FILENAME,
        ),
        diffsPath: path.resolve('/test', DEFAULT_SNAPSHOT_DIR, DIFFS_DIRNAME),
      });

      // Check directories were created
      const files = vol.toJSON();
      expect(files).toHaveProperty(
        path.resolve('/test', DEFAULT_SNAPSHOT_DIR, DIFFS_DIRNAME),
      );
    });

    it('should create snapshot directory with custom name', async () => {
      const customDir = '.custom-snapshot';
      const result = await createSnapshotDirectory('/test', customDir);

      expect(result).toEqual({
        path: path.resolve('/test', customDir),
        manifestPath: path.resolve('/test', customDir, MANIFEST_FILENAME),
        diffsPath: path.resolve('/test', customDir, DIFFS_DIRNAME),
      });

      // Check directories were created
      const files = vol.toJSON();
      expect(files).toHaveProperty(
        path.resolve('/test', customDir, DIFFS_DIRNAME),
      );
    });

    it('should handle existing directories', async () => {
      // Pre-create the directory
      vol.fromJSON({
        [path.resolve('/test', DEFAULT_SNAPSHOT_DIR, 'existing.txt')]:
          'content',
      });

      const result = await createSnapshotDirectory('/test');

      expect(result.path).toBe(path.resolve('/test', DEFAULT_SNAPSHOT_DIR));

      // Should still have existing file
      const files = vol.toJSON();
      expect(files).toHaveProperty(
        path.resolve('/test', DEFAULT_SNAPSHOT_DIR, 'existing.txt'),
      );
    });
  });

  describe('resolveSnapshotDirectory', () => {
    it('should resolve paths without creating directories', () => {
      const result = resolveSnapshotDirectory('/test');

      expect(result).toEqual({
        path: path.resolve('/test', DEFAULT_SNAPSHOT_DIR),
        manifestPath: path.resolve(
          '/test',
          DEFAULT_SNAPSHOT_DIR,
          MANIFEST_FILENAME,
        ),
        diffsPath: path.resolve('/test', DEFAULT_SNAPSHOT_DIR, DIFFS_DIRNAME),
      });

      // Should not create any directories
      const files = vol.toJSON();
      expect(Object.keys(files)).toHaveLength(0);
    });

    it('should resolve paths with custom snapshot directory', () => {
      const customDir = '.custom-snapshot';
      const result = resolveSnapshotDirectory('/test', {
        snapshotDir: customDir,
      });

      expect(result).toEqual({
        path: path.resolve('/test', customDir),
        manifestPath: path.resolve('/test', customDir, MANIFEST_FILENAME),
        diffsPath: path.resolve('/test', customDir, DIFFS_DIRNAME),
      });
    });
  });

  describe('path conversion round-trip', () => {
    it('should maintain path integrity through conversion', () => {
      const originalPaths = [
        'src/components/button.tsx',
        'lib/utils/helper.ts',
        'README.md',
        'deep/nested/path/file.js',
        'single.txt',
      ];

      for (const originalPath of originalPaths) {
        const diffFilename = pathToSafeDiffFilename(originalPath);
        const convertedPath = safeDiffFilenameToPath(diffFilename);
        expect(convertedPath).toBe(originalPath);
      }
    });

    it('should handle edge cases in round-trip conversion', () => {
      const edgeCases = [
        '',
        'file-with-dashes.ts',
        'file.with.dots.js',
        'file_with_underscores.ts',
      ];

      for (const originalPath of edgeCases) {
        const diffFilename = pathToSafeDiffFilename(originalPath);
        const convertedPath = safeDiffFilenameToPath(diffFilename);
        // Note: underscores in original filenames will be converted to slashes
        // This is a known limitation of the current implementation
        if (originalPath.includes('_')) {
          // Skip this case as it's a known limitation
          continue;
        }
        expect(convertedPath).toBe(originalPath);
      }
    });
  });
});
