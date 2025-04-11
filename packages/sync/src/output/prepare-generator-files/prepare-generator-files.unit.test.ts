import { describe, expect, it } from 'vitest';

import { createTestLogger } from '@src/tests/logger.test-helper.js';

import type { FileData } from '../generator-task-output.js';
import type { GeneratorOutputFileWriterContext } from './types.js';

import { createCodebaseReaderFromMemory } from '../codebase-file-reader.js';
import { PrepareGeneratorFilesError } from './errors.js';
import { prepareGeneratorFiles } from './prepare-generator-files.js';

function createMockContext(
  overrides: Partial<GeneratorOutputFileWriterContext> = {},
): GeneratorOutputFileWriterContext {
  return {
    formatters: [],
    logger: createTestLogger(),
    outputDirectory: '/test/output',
    previousGeneratedPayload: undefined,
    previousWorkingCodebase: undefined,
    ...overrides,
  };
}

const DEFAULT_FILE_CONTENTS = 'test contents';

let fileId = 0;

function createMockFileData(overrides: Partial<FileData> = {}): FileData {
  return {
    id: `test-id-${fileId++}`,
    contents: DEFAULT_FILE_CONTENTS,
    ...overrides,
  };
}

describe('prepareGeneratorFiles', () => {
  it('should prepare all files successfully', async () => {
    const files = new Map([
      [
        'file1.txt',
        createMockFileData({
          id: 'test-id',
        }),
      ],
      [
        'file2.txt',
        createMockFileData({
          id: 'test-id-2',
        }),
      ],
    ]);

    const result = await prepareGeneratorFiles({
      files,
      context: createMockContext(),
    });

    expect(result.files.length).toBe(2);
    expect(result.fileIdToRelativePathMap.size).toBe(2);
    expect(result.fileIdToRelativePathMap.get('test-id')).toBe('file1.txt');
    expect(result.fileIdToRelativePathMap.get('test-id-2')).toBe('file2.txt');
  });

  it('should throw PrepareGeneratorFilesError when a file preparation fails', async () => {
    const files = new Map([
      ['valid-file.txt', createMockFileData()],
      [
        'invalid-file.txt',
        createMockFileData({
          contents: Buffer.from([0]),
          options: { shouldFormat: true },
        }),
      ],
    ]);

    const mockContext = createMockContext({});

    const error = await prepareGeneratorFiles({
      files,
      context: mockContext,
    }).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(PrepareGeneratorFilesError);
    const { errors } = error as PrepareGeneratorFilesError;
    expect(errors.length).toEqual(1);
    expect(errors[0].relativePath).toEqual('invalid-file.txt');
  });

  it('should handle empty files map', async () => {
    const result = await prepareGeneratorFiles({
      files: new Map<string, FileData>(),
      context: createMockContext(),
    });

    expect(result.files.length).toBe(0);
    expect(result.fileIdToRelativePathMap.size).toBe(0);
  });

  it('should handle files with different options', async () => {
    const files = new Map([
      ['file1.txt', createMockFileData()],
      [
        'file2.txt',
        createMockFileData({ options: { shouldNeverOverwrite: true } }),
      ],
    ]);

    const mockContext = createMockContext({
      previousWorkingCodebase: createCodebaseReaderFromMemory(
        new Map([['file2.txt', Buffer.from('existing content')]]),
      ),
    });

    const result = await prepareGeneratorFiles({
      files,
      context: mockContext,
    });

    expect(result.files.length).toBe(2);
    const file2Result = result.files.find(
      (file) => file.relativePath === 'file2.txt',
    );
    expect(file2Result?.mergedContents).toBeUndefined();
    expect(file2Result?.generatedContents).toEqual(
      Buffer.from('test contents'),
    );
  });
});
