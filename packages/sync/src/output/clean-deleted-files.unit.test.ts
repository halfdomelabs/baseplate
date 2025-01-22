import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanDeletedFiles } from './clean-deleted-files.js';
import { createCodebaseFileReaderFromDirectory } from './codebase-file-reader.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('cleanDeletedFiles', () => {
  const outputDirectory = '/test/output';
  const previousGeneratedDirectory = '/test/previous';

  beforeEach(() => {
    vol.reset();
  });

  it('should delete files that are identical to previous generated version', async () => {
    // Setup test files
    vol.fromJSON({
      [`${outputDirectory}/file1.txt`]: 'content1',
      [`${outputDirectory}/file2.txt`]: 'content2',
      [`${previousGeneratedDirectory}/file1.txt`]: 'content1',
      [`${previousGeneratedDirectory}/file2.txt`]: 'content2',
    });

    const previousGeneratedPayload = {
      fileReader: createCodebaseFileReaderFromDirectory(
        previousGeneratedDirectory,
      ),
      fileIdToRelativePathMap: new Map<string, string>([
        ['id1', 'file1.txt'],
        ['id2', 'file2.txt'],
      ]),
    };

    const currentFileIdToRelativePathMap = new Map<string, string>([
      ['id2', 'file2.txt'],
    ]);

    const result = await cleanDeletedFiles({
      outputDirectory,
      previousGeneratedPayload,
      currentFileIdToRelativePathMap,
    });

    // Verify file1.txt was deleted and file2.txt remains
    expect(vol.existsSync(`${outputDirectory}/file1.txt`)).toBe(false);
    expect(vol.existsSync(`${outputDirectory}/file2.txt`)).toBe(true);
    expect(result.deletedRelativePaths).toEqual(['file1.txt']);
    expect(result.relativePathsPendingDelete).toEqual([]);
  });

  it('should mark modified files for pending deletion', async () => {
    // Setup test files with modified content
    vol.fromJSON({
      [`${outputDirectory}/file1.txt`]: 'modified content',
      [`${previousGeneratedDirectory}/file1.txt`]: 'original content',
    });

    const previousGeneratedPayload = {
      fileReader: createCodebaseFileReaderFromDirectory(
        previousGeneratedDirectory,
      ),
      fileIdToRelativePathMap: new Map<string, string>([['id1', 'file1.txt']]),
    };

    const currentFileIdToRelativePathMap = new Map<string, string>();

    const result = await cleanDeletedFiles({
      outputDirectory,
      previousGeneratedPayload,
      currentFileIdToRelativePathMap,
    });

    // Verify file was not deleted but marked for pending deletion
    expect(vol.existsSync(`${outputDirectory}/file1.txt`)).toBe(true);
    expect(result.deletedRelativePaths).toEqual([]);
    expect(result.relativePathsPendingDelete).toEqual(['file1.txt']);
  });

  it('should ignore files that do not exist', async () => {
    // Setup test files with missing file
    vol.fromJSON({
      [`${previousGeneratedDirectory}/file1.txt`]: 'content1',
    });

    const previousGeneratedPayload = {
      fileReader: createCodebaseFileReaderFromDirectory(
        previousGeneratedDirectory,
      ),
      fileIdToRelativePathMap: new Map<string, string>([['id1', 'file1.txt']]),
    };

    const currentFileIdToRelativePathMap = new Map<string, string>();

    const result = await cleanDeletedFiles({
      outputDirectory,
      previousGeneratedPayload,
      currentFileIdToRelativePathMap,
    });

    // Verify no files were affected
    expect(result.deletedRelativePaths).toEqual([]);
    expect(result.relativePathsPendingDelete).toEqual([]);
  });

  it('should ignore files that exist in current version', async () => {
    // Setup test files that exist in both versions
    vol.fromJSON({
      [`${outputDirectory}/file1.txt`]: 'content1',
      [`${previousGeneratedDirectory}/file1.txt`]: 'content1',
    });

    const previousGeneratedPayload = {
      fileReader: createCodebaseFileReaderFromDirectory(
        previousGeneratedDirectory,
      ),
      fileIdToRelativePathMap: new Map<string, string>([['id1', 'file1.txt']]),
    };

    const currentFileIdToRelativePathMap = new Map<string, string>([
      ['id1', 'file1.txt'],
    ]);

    const result = await cleanDeletedFiles({
      outputDirectory,
      previousGeneratedPayload,
      currentFileIdToRelativePathMap,
    });

    // Verify file was not affected
    expect(vol.existsSync(`${outputDirectory}/file1.txt`)).toBe(true);
    expect(result.deletedRelativePaths).toEqual([]);
    expect(result.relativePathsPendingDelete).toEqual([]);
  });
});
