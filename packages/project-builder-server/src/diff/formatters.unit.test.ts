import { describe, expect, it } from 'vitest';

import {
  colorizeUnifiedDiff,
  formatCompactDiff,
  formatFileDiff,
  formatUnifiedDiff,
} from './formatters.js';

describe('formatters', () => {
  describe('formatCompactDiff', () => {
    it('should format empty diff list', () => {
      const result = formatCompactDiff([]);

      expect(result).toContain('Diff Summary:');
      expect(result).toContain('Added: 0 files');
      expect(result).toContain('Modified: 0 files');
      expect(result).toContain('Deleted: 0 files');
      expect(result).toContain('✓ No differences found');
    });

    it('should format diff list with changes', () => {
      const files = [
        { path: 'new-file.ts', status: 'added' as const },
        {
          path: 'modified-file.ts',
          status: 'modified' as const,
          diff: '--- modified-file.ts\n+++ modified-file.ts\n@@ -1 +1 @@\n-old content\n+new content',
        },
        { path: 'binary-file.png', status: 'modified' as const },
      ];

      const result = formatCompactDiff(files);

      expect(result).toContain('Added: 1 files');
      expect(result).toContain('Modified: 2 files');
      expect(result).toContain('Total: 3 files');
      expect(result).toContain('Added files:');
      expect(result).toContain('+ new-file.ts');
      expect(result).toContain('Modified files:');
      expect(result).toContain('~ modified-file.ts');
      expect(result).toContain('~ binary-file.png');
    });
  });

  describe('formatFileDiff', () => {
    it('should format added file diff', () => {
      const result = formatFileDiff({
        path: 'new-file.ts',
        status: 'added',
        diff: '--- new-file.ts\n+++ new-file.ts\n@@ -0,0 +1 @@\n+export const foo = "bar";',
      });

      expect(result).toContain('++ new-file.ts');
      expect(result).toContain('+export const foo = "bar";');
    });

    it('should format modified file diff', () => {
      const result = formatFileDiff({
        path: 'modified-file.ts',
        status: 'modified',
        diff: '--- modified-file.ts\n+++ modified-file.ts\n@@ -1 +1 @@\n-export const foo = "old";\n+export const foo = "new";',
      });

      expect(result).toContain('~~ modified-file.ts');
      expect(result).toContain('-export const foo = "old";');
      expect(result).toContain('+export const foo = "new";');
    });

    it('should format file without diff content', () => {
      const result = formatFileDiff({
        path: 'image.png',
        status: 'modified',
      });

      expect(result).toContain('~~ image.png');
      expect(result).not.toContain('---');
    });

    it('should format deleted file diff', () => {
      const result = formatFileDiff({
        path: 'deleted-file.ts',
        status: 'deleted',
        diff: '--- deleted-file.ts\n+++ deleted-file.ts\n@@ -1 +0,0 @@\n-export const foo = "bar";',
      });

      expect(result).toContain('-- deleted-file.ts');
      expect(result).toContain('-export const foo = "bar";');
    });
  });

  describe('formatUnifiedDiff', () => {
    it('should format empty diff list', () => {
      const result = formatUnifiedDiff([]);

      expect(result).toContain('✓ No differences found');
    });

    it('should format diff list with changes', () => {
      const files = [
        {
          path: 'file1.ts',
          status: 'added' as const,
          diff: '--- file1.ts\n+++ file1.ts\n@@ -0,0 +1 @@\n+content1',
        },
        {
          path: 'file2.ts',
          status: 'modified' as const,
          diff: '--- file2.ts\n+++ file2.ts\n@@ -1 +1 @@\n-old content\n+new content',
        },
      ];

      const result = formatUnifiedDiff(files);

      expect(result).toContain('Found 2 files with differences:');
      expect(result).toContain('++ file1.ts');
      expect(result).toContain('~~ file2.ts');
      expect(result).toContain('+content1');
      expect(result).toContain('-old content');
      expect(result).toContain('+new content');
    });
  });

  describe('colorizeUnifiedDiff', () => {
    it('should preserve content in diff lines', () => {
      const input = '--- a.ts\n+++ b.ts\n@@ -1 +1 @@\n-old\n+new\n context';
      const result = colorizeUnifiedDiff(input);

      expect(result).toContain('old');
      expect(result).toContain('new');
      expect(result).toContain('context');
    });
  });
});
