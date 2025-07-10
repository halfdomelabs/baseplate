import { describe, expect, it } from 'vitest';

import type { DiffSummary, FileDiff } from './types.js';

import {
  formatCompactDiff,
  formatFileDiff,
  formatUnifiedDiff,
} from './formatters.js';

describe('formatters', () => {
  describe('formatCompactDiff', () => {
    it('should format empty diff summary', () => {
      const summary: DiffSummary = {
        totalFiles: 0,
        addedFiles: 0,
        modifiedFiles: 0,
        deletedFiles: 0,
        diffs: [],
      };

      const result = formatCompactDiff(summary);

      expect(result).toContain('Diff Summary:');
      expect(result).toContain('Added: 0 files');
      expect(result).toContain('Modified: 0 files');
      expect(result).toContain('Deleted: 0 files');
      expect(result).toContain('✓ No differences found');
    });

    it('should format diff summary with changes', () => {
      const diffs: FileDiff[] = [
        {
          path: 'new-file.ts',
          type: 'added',
          isBinary: false,
          generatedContent: 'content',
        },
        {
          path: 'modified-file.ts',
          type: 'modified',
          isBinary: false,
          generatedContent: 'new content',
          workingContent: 'old content',
        },
        {
          path: 'binary-file.png',
          type: 'modified',
          isBinary: true,
          generatedContent: Buffer.from('new'),
          workingContent: Buffer.from('old'),
        },
      ];

      const summary: DiffSummary = {
        totalFiles: 3,
        addedFiles: 1,
        modifiedFiles: 2,
        deletedFiles: 0,
        diffs,
      };

      const result = formatCompactDiff(summary);

      expect(result).toContain('Added: 1 files');
      expect(result).toContain('Modified: 2 files');
      expect(result).toContain('Total: 3 files');
      expect(result).toContain('Added files:');
      expect(result).toContain('+ new-file.ts');
      expect(result).toContain('Modified files:');
      expect(result).toContain('~ modified-file.ts');
      expect(result).toContain('~ binary-file.png (binary)');
    });
  });

  describe('formatFileDiff', () => {
    it('should format added file diff', () => {
      const diff: FileDiff = {
        path: 'new-file.ts',
        type: 'added',
        isBinary: false,
        generatedContent: 'export const foo = "bar";',
        unifiedDiff:
          '--- new-file.ts\n+++ new-file.ts\n@@ -0,0 +1 @@\n+export const foo = "bar";',
      };

      const result = formatFileDiff(diff);

      expect(result).toContain('++ new-file.ts');
      expect(result).toContain('+export const foo = "bar";');
    });

    it('should format modified file diff', () => {
      const diff: FileDiff = {
        path: 'modified-file.ts',
        type: 'modified',
        isBinary: false,
        generatedContent: 'export const foo = "new";',
        workingContent: 'export const foo = "old";',
        unifiedDiff:
          '--- modified-file.ts\n+++ modified-file.ts\n@@ -1 +1 @@\n-export const foo = "old";\n+export const foo = "new";',
      };

      const result = formatFileDiff(diff);

      expect(result).toContain('~~ modified-file.ts');
      expect(result).toContain('-export const foo = "old";');
      expect(result).toContain('+export const foo = "new";');
    });

    it('should format binary file diff', () => {
      const diff: FileDiff = {
        path: 'image.png',
        type: 'modified',
        isBinary: true,
        generatedContent: Buffer.from('new'),
        workingContent: Buffer.from('old'),
      };

      const result = formatFileDiff(diff);

      expect(result).toContain('~~ image.png');
      expect(result).toContain('Binary file');
    });

    it('should format deleted file diff', () => {
      const diff: FileDiff = {
        path: 'deleted-file.ts',
        type: 'deleted',
        isBinary: false,
        workingContent: 'export const foo = "bar";',
        unifiedDiff:
          '--- deleted-file.ts\n+++ deleted-file.ts\n@@ -1 +0,0 @@\n-export const foo = "bar";',
      };

      const result = formatFileDiff(diff);

      expect(result).toContain('-- deleted-file.ts');
      expect(result).toContain('-export const foo = "bar";');
    });
  });

  describe('formatUnifiedDiff', () => {
    it('should format empty diff summary', () => {
      const summary: DiffSummary = {
        totalFiles: 0,
        addedFiles: 0,
        modifiedFiles: 0,
        deletedFiles: 0,
        diffs: [],
      };

      const result = formatUnifiedDiff(summary);

      expect(result).toContain('✓ No differences found');
    });

    it('should format diff summary with changes', () => {
      const diffs: FileDiff[] = [
        {
          path: 'file1.ts',
          type: 'added',
          isBinary: false,
          generatedContent: 'content1',
          unifiedDiff: '--- file1.ts\n+++ file1.ts\n@@ -0,0 +1 @@\n+content1',
        },
        {
          path: 'file2.ts',
          type: 'modified',
          isBinary: false,
          generatedContent: 'new content',
          workingContent: 'old content',
          unifiedDiff:
            '--- file2.ts\n+++ file2.ts\n@@ -1 +1 @@\n-old content\n+new content',
        },
      ];

      const summary: DiffSummary = {
        totalFiles: 2,
        addedFiles: 1,
        modifiedFiles: 1,
        deletedFiles: 0,
        diffs,
      };

      const result = formatUnifiedDiff(summary);

      expect(result).toContain('Found 2 files with differences:');
      expect(result).toContain('++ file1.ts');
      expect(result).toContain('~~ file2.ts');
      expect(result).toContain('+content1');
      expect(result).toContain('-old content');
      expect(result).toContain('+new content');
    });
  });
});
