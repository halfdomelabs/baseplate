import type { GeneratorOutput } from '@baseplate-dev/sync';
import type { Ignore } from 'ignore';

import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  compareFiles,
  createUnifiedDiff,
  isContentBinary,
  readWorkingFile,
  scanWorkingDirectory,
  shouldIncludeFile,
} from './diff-utils.js';

// Mock the file system
vi.mock('node:fs/promises');
vi.mock('isbinaryfile');
vi.mock('globby');

describe('diff-utils', () => {
  beforeEach(async () => {
    vol.reset();
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock for globby to return empty array
    const { globby } = await import('globby');
    vi.mocked(globby).mockResolvedValue([]);
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
    it('should create a unified diff for text changes (generated → working)', () => {
      const generatedContent = 'Hello, world!\nThis is line 2.';
      const workingContent = 'Hello, universe!\nThis is line 2.';

      const diff = createUnifiedDiff(
        'test.txt',
        generatedContent,
        workingContent,
      );

      expect(diff).toContain('--- test.txt');
      expect(diff).toContain('+++ test.txt');
      expect(diff).toContain('-Hello, world!');
      expect(diff).toContain('+Hello, universe!');
    });

    it('should handle empty content', () => {
      const diff = createUnifiedDiff('test.txt', 'Old content', '');

      expect(diff).toContain('--- test.txt');
      expect(diff).toContain('+++ test.txt');
      expect(diff).toContain('-Old content');
    });
  });

  describe('scanWorkingDirectory', () => {
    it('should scan all files when no glob patterns provided', async () => {
      const { globby } = await import('globby');
      vi.mocked(globby).mockResolvedValue([
        'file1.ts',
        'file2.js',
        'dir/file3.txt',
      ]);

      const result = await scanWorkingDirectory('/test');

      expect(globby).toHaveBeenCalledWith(
        ['**/*'],
        expect.objectContaining({
          cwd: '/test',
          onlyFiles: true,
          gitignore: true,
          absolute: false,
        }),
      );
      expect(result).toEqual(['file1.ts', 'file2.js', 'dir/file3.txt']);
    });

    it('should use provided glob patterns', async () => {
      const { globby } = await import('globby');
      vi.mocked(globby).mockResolvedValue(['file1.ts', 'file2.ts']);

      const result = await scanWorkingDirectory('/test', ['**/*.ts']);

      expect(globby).toHaveBeenCalledWith(
        ['**/*.ts'],
        expect.objectContaining({
          cwd: '/test',
          onlyFiles: true,
          gitignore: true,
          absolute: false,
        }),
      );
      expect(result).toEqual(['file1.ts', 'file2.ts']);
    });

    it('should filter files using ignore patterns', async () => {
      const { globby } = await import('globby');
      vi.mocked(globby).mockResolvedValue([
        'file1.ts',
        'node_modules/lib.js',
        'file2.ts',
      ]);

      // Mock ignore instance
      const mockIgnore = {
        ignores: vi.fn((path: string) => path.includes('node_modules')),
      } as unknown as Ignore;

      const result = await scanWorkingDirectory('/test', undefined, mockIgnore);

      expect(result).toEqual(['file1.ts', 'file2.ts']);
    });
  });

  describe('compareFiles', () => {
    it('should detect deleted files (generator creates file that should not exist)', async () => {
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
      expect(result.deletedFiles).toBe(1);
      expect(result.diffs[0]).toMatchObject({
        path: 'new-file.ts',
        type: 'deleted',
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

    it('should detect added files (working file that generator should create)', async () => {
      const { isBinaryFile } = await import('isbinaryfile');
      const { globby } = await import('globby');

      vi.mocked(isBinaryFile).mockResolvedValue(false);
      vi.mocked(globby).mockResolvedValue(['old-file.ts', 'shared-file.ts']);

      vol.fromJSON({
        '/test/old-file.ts': 'export const old = "value";',
        '/test/shared-file.ts': 'export const shared = "value";',
      });

      const generatorOutput: GeneratorOutput = {
        files: new Map([
          [
            'shared-file.ts',
            { id: '1', contents: 'export const shared = "value";' },
          ],
          // old-file.ts is not in generated output, so it should be detected as added (generator should create it)
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      };

      const result = await compareFiles('/test', generatorOutput);

      expect(result.totalFiles).toBe(1);
      expect(result.addedFiles).toBe(1);
      expect(result.diffs[0]).toMatchObject({
        path: 'old-file.ts',
        type: 'added',
        isBinary: false,
      });
    });

    it('should detect both modified and added files', async () => {
      const { isBinaryFile } = await import('isbinaryfile');
      const { globby } = await import('globby');

      vi.mocked(isBinaryFile).mockResolvedValue(false);
      vi.mocked(globby).mockResolvedValue(['existing-file.ts', 'old-file.ts']);

      vol.fromJSON({
        '/test/existing-file.ts': 'export const foo = "old";',
        '/test/old-file.ts': 'export const old = "value";',
      });

      const generatorOutput: GeneratorOutput = {
        files: new Map([
          [
            'existing-file.ts',
            { id: '1', contents: 'export const foo = "new";' },
          ],
          // old-file.ts is not in generated output, so it should be detected as added (generator should create it)
        ]),
        postWriteCommands: [],
        globalFormatters: [],
      };

      const result = await compareFiles('/test', generatorOutput);

      expect(result.totalFiles).toBe(2);
      expect(result.modifiedFiles).toBe(1);
      expect(result.addedFiles).toBe(1);

      const modifiedFile = result.diffs.find((d) => d.type === 'modified');
      const addedFile = result.diffs.find((d) => d.type === 'added');

      expect(modifiedFile?.path).toBe('existing-file.ts');
      expect(addedFile?.path).toBe('old-file.ts');
    });
  });
});
