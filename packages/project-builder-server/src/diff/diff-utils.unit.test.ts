import type { GeneratorOutput } from '@baseplate-dev/sync';

import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  compareFiles,
  createUnifiedDiff,
  isContentBinary,
  readWorkingFile,
  shouldIncludeFile,
} from './diff-utils.js';

// Mock the file system
vi.mock('node:fs/promises');
vi.mock('isbinaryfile');

describe('diff-utils', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('shouldIncludeFile', () => {
    it('should return true when no glob patterns are provided', () => {
      expect(shouldIncludeFile('any/file.ts')).toBe(true);
      expect(shouldIncludeFile('any/file.ts', [])).toBe(true);
    });

    it('should match files against glob patterns', () => {
      const patterns = ['**/*.ts', '**/*.js'];

      expect(shouldIncludeFile('src/file.ts', patterns)).toBe(true);
      expect(shouldIncludeFile('src/file.js', patterns)).toBe(true);
      expect(shouldIncludeFile('src/file.py', patterns)).toBe(false);
    });

    it('should handle complex glob patterns', () => {
      const patterns = ['src/**/*.ts'];

      expect(shouldIncludeFile('src/utils/helper.ts', patterns)).toBe(true);
      expect(shouldIncludeFile('lib/utils/helper.ts', patterns)).toBe(false);
    });
  });

  describe('readWorkingFile', () => {
    it('should return null for non-existent files', async () => {
      const result = await readWorkingFile('/test', 'non-existent.txt');
      expect(result).toBeNull();
    });

    it('should read text files as strings', async () => {
      const { isBinaryFile } = await import('isbinaryfile');
      vi.mocked(isBinaryFile).mockResolvedValue(false);

      vol.fromJSON({
        '/test/file.txt': 'Hello, world!',
      });

      const result = await readWorkingFile('/test', 'file.txt');
      expect(result).toBe('Hello, world!');
    });

    it('should read binary files as buffers', async () => {
      const { isBinaryFile } = await import('isbinaryfile');
      vi.mocked(isBinaryFile).mockResolvedValue(true);

      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      vol.fromJSON({
        '/test/image.png': binaryData,
      });

      const result = await readWorkingFile('/test', 'image.png');
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('isContentBinary', () => {
    it('should return true for Buffer content', () => {
      const buffer = Buffer.from('test');
      expect(isContentBinary(buffer)).toBe(true);
    });

    it('should return false for string content', () => {
      expect(isContentBinary('test string')).toBe(false);
    });
  });

  describe('createUnifiedDiff', () => {
    it('should create a unified diff for text changes', () => {
      const oldContent = 'Hello, world!\nThis is line 2.';
      const newContent = 'Hello, universe!\nThis is line 2.';

      const diff = createUnifiedDiff('test.txt', oldContent, newContent);

      expect(diff).toContain('--- test.txt');
      expect(diff).toContain('+++ test.txt');
      expect(diff).toContain('-Hello, world!');
      expect(diff).toContain('+Hello, universe!');
    });

    it('should handle empty content', () => {
      const diff = createUnifiedDiff('test.txt', '', 'New content');

      expect(diff).toContain('--- test.txt');
      expect(diff).toContain('+++ test.txt');
      expect(diff).toContain('+New content');
    });
  });

  describe('compareFiles', () => {
    it('should detect added files', async () => {
      const { isBinaryFile } = await import('isbinaryfile');
      vi.mocked(isBinaryFile).mockResolvedValue(false);

      const generatorOutput: GeneratorOutput = {
        files: new Map([
          ['new-file.ts', { id: '1', contents: 'export const foo = "bar";' }],
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      };

      const result = await compareFiles('/test', generatorOutput);

      expect(result.totalFiles).toBe(1);
      expect(result.addedFiles).toBe(1);
      expect(result.diffs[0]).toMatchObject({
        path: 'new-file.ts',
        type: 'added',
        isBinary: false,
      });
    });

    it('should detect modified files', async () => {
      const { isBinaryFile } = await import('isbinaryfile');
      vi.mocked(isBinaryFile).mockResolvedValue(false);

      vol.fromJSON({
        '/test/existing-file.ts': 'export const foo = "old";',
      });

      const generatorOutput: GeneratorOutput = {
        files: new Map([
          [
            'existing-file.ts',
            { id: '1', contents: 'export const foo = "new";' },
          ],
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      };

      const result = await compareFiles('/test', generatorOutput);

      expect(result.totalFiles).toBe(1);
      expect(result.modifiedFiles).toBe(1);
      expect(result.diffs[0]).toMatchObject({
        path: 'existing-file.ts',
        type: 'modified',
        isBinary: false,
      });
    });

    it('should handle binary files', async () => {
      const { isBinaryFile } = await import('isbinaryfile');
      vi.mocked(isBinaryFile).mockResolvedValue(true);

      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      vol.fromJSON({
        '/test/image.png': binaryData,
      });

      const generatorOutput: GeneratorOutput = {
        files: new Map([
          [
            'image.png',
            { id: '1', contents: Buffer.from([0x89, 0x50, 0x4e, 0x48]) },
          ],
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      };

      const result = await compareFiles('/test', generatorOutput);

      expect(result.totalFiles).toBe(1);
      expect(result.modifiedFiles).toBe(1);
      expect(result.diffs[0]).toMatchObject({
        path: 'image.png',
        type: 'modified',
        isBinary: true,
      });
    });

    it('should filter files by glob patterns', async () => {
      const { isBinaryFile } = await import('isbinaryfile');
      vi.mocked(isBinaryFile).mockResolvedValue(false);

      const generatorOutput: GeneratorOutput = {
        files: new Map([
          ['file.ts', { id: '1', contents: 'typescript' }],
          ['file.js', { id: '2', contents: 'javascript' }],
          ['file.py', { id: '3', contents: 'python' }],
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      };

      const result = await compareFiles('/test', generatorOutput, ['**/*.ts']);

      expect(result.totalFiles).toBe(1);
      expect(result.diffs[0].path).toBe('file.ts');
    });
  });
});
