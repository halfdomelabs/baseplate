import { describe, expect, it } from 'vitest';

import { createTestLogger } from '#src/tests/logger.test-utils.js';

import type { FileData } from '../generator-task-output.js';
import type {
  GeneratorOutputFileWriterContext,
  PreviousGeneratedPayload,
} from './types.js';

import { createCodebaseReaderFromMemory } from '../codebase-file-reader.js';
import { ConflictDetectedError, FormatterError } from '../errors.js';
import { simpleDiffAlgorithm } from '../string-merge-algorithms/simple-diff.js';
import { prepareGeneratorFile } from './prepare-generator-file.js';

function createMockContext(
  overrides: Partial<GeneratorOutputFileWriterContext> = {},
): GeneratorOutputFileWriterContext {
  return {
    formatters: [],
    logger: createTestLogger(),
    outputDirectory: '/test/output',
    previousGeneratedPayload: undefined,
    previousWorkingCodebase: undefined,
    overwriteOptions: undefined,
    ...overrides,
  };
}

const DEFAULT_FILE_ID = 'test-id';
const DEFAULT_FILE_CONTENTS = 'test contents';

function createMockFileData(overrides: Partial<FileData> = {}): FileData {
  return {
    id: DEFAULT_FILE_ID,
    contents: DEFAULT_FILE_CONTENTS,
    ...overrides,
  };
}

describe('prepareGeneratorFile', () => {
  it('should handle new files with no previous version', async () => {
    const result = await prepareGeneratorFile({
      relativePath: 'new-file.txt',
      data: createMockFileData(),
      context: createMockContext(),
    });

    const expectedContents = Buffer.from(DEFAULT_FILE_CONTENTS);

    expect(result).toEqual({
      relativePath: 'new-file.txt',
      previousRelativePath: undefined,
      mergedContents: expectedContents,
      generatedContents: expectedContents,
    });
  });

  it('should respect shouldNeverOverwrite option', async () => {
    const workingFiles = new Map([
      ['existing-file.txt', Buffer.from('existing content')],
    ]);

    const result = await prepareGeneratorFile({
      relativePath: 'existing-file.txt',
      data: createMockFileData({
        options: { shouldNeverOverwrite: true },
      }),
      context: createMockContext({
        previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
      }),
    });

    expect(result).toEqual({
      relativePath: 'existing-file.txt',
      previousRelativePath: 'existing-file.txt',
      mergedContents: undefined,
      generatedContents: Buffer.from(DEFAULT_FILE_CONTENTS),
    });
  });

  it('should detect conflicts in working files', async () => {
    const workingFiles = new Map([
      ['file.txt', Buffer.from('<<<<<<< HEAD\nconflict\n>>>>>>> branch')],
    ]);

    const previousFiles = new Map([['file.txt', Buffer.from('original')]]);

    const mockPreviousPayload: PreviousGeneratedPayload = {
      fileReader: createCodebaseReaderFromMemory(previousFiles),
      fileIdToRelativePathMap: new Map([['test-id', 'file.txt']]),
    };

    await expect(
      prepareGeneratorFile({
        relativePath: 'file.txt',
        data: createMockFileData(),
        context: createMockContext({
          previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
          previousGeneratedPayload: mockPreviousPayload,
        }),
      }),
    ).rejects.toThrow(ConflictDetectedError);
  });

  it('should handle formatting errors', async () => {
    const mockFormatter = {
      name: 'test-formatter',
      fileExtensions: ['.txt'],
      format: () => {
        throw new Error('Format error');
      },
    };

    await expect(
      prepareGeneratorFile({
        relativePath: 'file.txt',
        data: createMockFileData({}),
        context: createMockContext({
          formatters: [mockFormatter],
        }),
      }),
    ).rejects.toBeInstanceOf(FormatterError);
  });

  it('should handle binary file conflicts', async () => {
    const binaryContent = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const workingFiles = new Map([['image.png', binaryContent]]);

    const result = await prepareGeneratorFile({
      relativePath: 'image.png',
      data: createMockFileData({
        contents: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d]),
        options: {
          skipFormatting: true,
        },
      }),
      context: createMockContext({
        previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
      }),
    });

    expect(result).toEqual({
      relativePath: 'image.png',
      previousRelativePath: 'image.png',
      mergedContents: binaryContent,
      generatedContents: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d]),
      generatedConflictRelativePath: 'image.png.conflict',
      hasConflict: true,
    });
  });

  it('should use existing file when content is unchanged', async () => {
    const content = 'unchanged content';
    const existingContent = 'existingContent';
    const workingFiles = new Map([['file.txt', Buffer.from(existingContent)]]);

    const previousGeneratedFiles = new Map([
      ['file.txt', Buffer.from(content)],
    ]);

    const mockPreviousPayload: PreviousGeneratedPayload = {
      fileReader: createCodebaseReaderFromMemory(previousGeneratedFiles),
      fileIdToRelativePathMap: new Map([[DEFAULT_FILE_ID, 'file.txt']]),
    };

    const result = await prepareGeneratorFile({
      relativePath: 'file.txt',
      data: createMockFileData({
        contents: content,
      }),
      context: createMockContext({
        previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        previousGeneratedPayload: mockPreviousPayload,
      }),
    });

    expect(result).toEqual({
      relativePath: 'file.txt',
      previousRelativePath: 'file.txt',
      mergedContents: undefined,
      generatedContents: Buffer.from(content),
    });
  });

  it('should not re-write a deleted file when content is unchanged', async () => {
    const content = 'unchanged content';
    const workingFiles = new Map<string, Buffer>();

    const previousGeneratedFiles = new Map([
      ['file.txt', Buffer.from(content)],
    ]);

    const mockPreviousPayload: PreviousGeneratedPayload = {
      fileReader: createCodebaseReaderFromMemory(previousGeneratedFiles),
      fileIdToRelativePathMap: new Map([[DEFAULT_FILE_ID, 'file.txt']]),
    };

    const result = await prepareGeneratorFile({
      relativePath: 'file.txt',
      data: createMockFileData({
        contents: content,
      }),
      context: createMockContext({
        previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        previousGeneratedPayload: mockPreviousPayload,
      }),
    });

    expect(result).toEqual({
      relativePath: 'file.txt',
      previousRelativePath: undefined,
      mergedContents: undefined,
      generatedContents: Buffer.from(content),
    });
  });

  it('should handle JSON files with special merge algorithm', async () => {
    const workingFiles = new Map([
      ['config.json', Buffer.from('{"key": "original","other": "other"}')],
    ]);

    const previousFiles = new Map([
      ['config.json', Buffer.from('{"key": "original"}')],
    ]);

    const mockPreviousPayload: PreviousGeneratedPayload = {
      fileReader: createCodebaseReaderFromMemory(previousFiles),
      fileIdToRelativePathMap: new Map([['test-id', 'config.json']]),
    };

    const result = await prepareGeneratorFile({
      relativePath: 'config.json',
      data: createMockFileData({
        contents: '{"key": "generated"}',
      }),
      context: createMockContext({
        previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        previousGeneratedPayload: mockPreviousPayload,
      }),
    });

    expect(result.mergedContents?.toString('utf8')).toEqual(
      JSON.stringify({ key: 'generated', other: 'other' }, null, 2),
    );
  });

  it('should handle renaming a file when target does not exist', async () => {
    const workingFiles = new Map([
      ['old-file.txt', Buffer.from('original content')],
    ]);

    const previousFiles = new Map([
      ['old-file.txt', Buffer.from('original content')],
    ]);

    const mockPreviousPayload: PreviousGeneratedPayload = {
      fileReader: createCodebaseReaderFromMemory(previousFiles),
      fileIdToRelativePathMap: new Map([['test-id', 'old-file.txt']]),
    };

    const result = await prepareGeneratorFile({
      relativePath: 'new-file.txt',
      data: createMockFileData({
        contents: 'new content',
      }),
      context: createMockContext({
        previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        previousGeneratedPayload: mockPreviousPayload,
      }),
    });

    expect(result).toEqual({
      relativePath: 'new-file.txt',
      previousRelativePath: 'old-file.txt',
      mergedContents: Buffer.from('new content'),
      generatedContents: Buffer.from('new content'),
      hasConflict: false,
    });
  });

  it('should handle renaming a file from an alternate file ID', async () => {
    const workingFiles = new Map([
      ['old-file.txt', Buffer.from('original content')],
    ]);

    const previousFiles = new Map([
      ['old-file.txt', Buffer.from('original content')],
    ]);

    const mockPreviousPayload: PreviousGeneratedPayload = {
      fileReader: createCodebaseReaderFromMemory(previousFiles),
      fileIdToRelativePathMap: new Map([['old-id', 'old-file.txt']]),
    };

    const result = await prepareGeneratorFile({
      relativePath: 'new-file.txt',
      data: createMockFileData({
        contents: 'new content',
        options: {
          alternateFullIds: ['old-id'],
        },
      }),
      context: createMockContext({
        previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        previousGeneratedPayload: mockPreviousPayload,
      }),
    });

    expect(result).toEqual({
      relativePath: 'new-file.txt',
      previousRelativePath: 'old-file.txt',
      mergedContents: Buffer.from('new content'),
      generatedContents: Buffer.from('new content'),
      hasConflict: false,
    });
  });

  it('should handle renaming a file when target exists', async () => {
    const workingFiles = new Map([
      ['old-file.txt', Buffer.from('original content')],
      ['new-file.txt', Buffer.from('existing content')],
    ]);

    const previousFiles = new Map([
      ['old-file.txt', Buffer.from('original content')],
    ]);

    const mockPreviousPayload: PreviousGeneratedPayload = {
      fileReader: createCodebaseReaderFromMemory(previousFiles),
      fileIdToRelativePathMap: new Map([['test-id', 'old-file.txt']]),
    };

    const result = await prepareGeneratorFile({
      relativePath: 'new-file.txt',
      data: createMockFileData({
        contents: 'new content',
      }),
      context: createMockContext({
        previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        previousGeneratedPayload: mockPreviousPayload,
      }),
    });

    expect(result).toEqual({
      relativePath: 'new-file.txt',
      previousRelativePath: 'new-file.txt',
      hasConflict: true,
      mergedContents: Buffer.from(
        simpleDiffAlgorithm({
          previousWorkingText: 'existing content',
          currentGeneratedText: 'new content',
        })?.mergedText ?? '',
      ),
      generatedContents: Buffer.from('new content'),
    });
  });

  it('should handle files that were deleted in working codebase but modified in generated codebase', async () => {
    const content = 'modified content';
    const workingFiles = new Map<string, Buffer>();

    const previousGeneratedFiles = new Map([
      ['file.txt', Buffer.from('original content')],
    ]);

    const mockPreviousPayload: PreviousGeneratedPayload = {
      fileReader: createCodebaseReaderFromMemory(previousGeneratedFiles),
      fileIdToRelativePathMap: new Map([[DEFAULT_FILE_ID, 'file.txt']]),
    };

    const result = await prepareGeneratorFile({
      relativePath: 'file.txt',
      data: createMockFileData({
        contents: content,
      }),
      context: createMockContext({
        previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        previousGeneratedPayload: mockPreviousPayload,
      }),
    });

    expect(result).toEqual({
      relativePath: 'file.txt',
      previousRelativePath: undefined,
      mergedContents: Buffer.from(content),
      generatedContents: Buffer.from(content),
      deletedInWorking: true,
    });
  });

  it('should select formatter by file extension', async () => {
    const mockFormatter = {
      name: 'test-formatter',
      fileExtensions: ['.js'],
      format: (content: string) => `formatted:${content}`,
    };

    const result = await prepareGeneratorFile({
      relativePath: 'file.js',
      data: createMockFileData({
        contents: 'content',
      }),
      context: createMockContext({
        formatters: [mockFormatter],
      }),
    });

    expect(result.mergedContents?.toString()).toBe('formatted:content');
  });

  it('should select formatter by file name', async () => {
    const mockFormatter = {
      name: 'test-formatter',
      fileNames: ['.prettierrc'],
      format: (content: string) => `formatted:${content}`,
    };

    const result = await prepareGeneratorFile({
      relativePath: '.prettierrc',
      data: createMockFileData({
        contents: 'content',
      }),
      context: createMockContext({
        formatters: [mockFormatter],
      }),
    });

    expect(result.mergedContents?.toString()).toBe('formatted:content');
  });

  it('should throw error when multiple formatters match', async () => {
    const formatter1 = {
      name: 'formatter1',
      fileExtensions: ['.js'],
      format: (content: string) => content,
    };

    const formatter2 = {
      name: 'formatter2',
      fileExtensions: ['.js'],
      format: (content: string) => content,
    };

    await expect(
      prepareGeneratorFile({
        relativePath: 'file.js',
        data: createMockFileData({
          contents: 'content',
        }),
        context: createMockContext({
          formatters: [formatter1, formatter2],
        }),
      }),
    ).rejects.toThrow(
      'Multiple formatters found for file file.js: formatter1, formatter2',
    );
  });

  it('should skip formatting when no matching formatter is found', async () => {
    const mockFormatter = {
      name: 'test-formatter',
      fileExtensions: ['.js'],
      format: (content: string) => `formatted:${content}`,
    };

    const result = await prepareGeneratorFile({
      relativePath: 'file.txt',
      data: createMockFileData({
        contents: 'content',
      }),
      context: createMockContext({
        formatters: [mockFormatter],
      }),
    });

    expect(result.mergedContents?.toString()).toBe('content');
  });

  it('should handle skipWriting option', async () => {
    const result = await prepareGeneratorFile({
      relativePath: 'file.txt',
      data: createMockFileData({
        contents: 'content',
        options: { skipWriting: true },
      }),
      context: createMockContext(),
    });

    expect(result).toEqual({
      relativePath: 'file.txt',
      previousRelativePath: undefined,
      mergedContents: undefined,
      generatedContents: Buffer.from('content'),
    });
  });

  describe('overwrite options functionality', () => {
    it('should bypass merge when overwrite is enabled with different content', async () => {
      const workingFiles = new Map([
        ['file.txt', Buffer.from('working content')],
      ]);

      const previousFiles = new Map([
        ['file.txt', Buffer.from('previous content')],
      ]);

      const mockPreviousPayload: PreviousGeneratedPayload = {
        fileReader: createCodebaseReaderFromMemory(previousFiles),
        fileIdToRelativePathMap: new Map([['test-id', 'file.txt']]),
      };

      const result = await prepareGeneratorFile({
        relativePath: 'file.txt',
        data: createMockFileData({
          contents: 'new generated content',
        }),
        context: createMockContext({
          overwriteOptions: { enabled: true },
          previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
          previousGeneratedPayload: mockPreviousPayload,
        }),
      });

      expect(result).toEqual({
        relativePath: 'file.txt',
        previousRelativePath: 'file.txt',
        mergedContents: Buffer.from('new generated content'),
        generatedContents: Buffer.from('new generated content'),
      });
    });

    it('should bypass merge when overwrite is enabled with conflicting content', async () => {
      const workingFiles = new Map([
        ['file.txt', Buffer.from('modified working content')],
      ]);

      const previousFiles = new Map([
        ['file.txt', Buffer.from('original content')],
      ]);

      const mockPreviousPayload: PreviousGeneratedPayload = {
        fileReader: createCodebaseReaderFromMemory(previousFiles),
        fileIdToRelativePathMap: new Map([['test-id', 'file.txt']]),
      };

      const result = await prepareGeneratorFile({
        relativePath: 'file.txt',
        data: createMockFileData({
          contents: 'completely different generated content',
        }),
        context: createMockContext({
          overwriteOptions: { enabled: true },
          previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
          previousGeneratedPayload: mockPreviousPayload,
        }),
      });

      expect(result).toEqual({
        relativePath: 'file.txt',
        previousRelativePath: 'file.txt',
        mergedContents: Buffer.from('completely different generated content'),
        generatedContents: Buffer.from(
          'completely different generated content',
        ),
      });
    });

    it('should overwrite even when generated content is unchanged from previous generation', async () => {
      const content = 'unchanged generated content';
      const workingFiles = new Map([
        ['file.txt', Buffer.from('modified by user')],
      ]);
      const previousFiles = new Map([['file.txt', Buffer.from(content)]]);

      const mockPreviousPayload: PreviousGeneratedPayload = {
        fileReader: createCodebaseReaderFromMemory(previousFiles),
        fileIdToRelativePathMap: new Map([['test-id', 'file.txt']]),
      };

      const result = await prepareGeneratorFile({
        relativePath: 'file.txt',
        data: createMockFileData({
          contents: content, // same as previous generation
        }),
        context: createMockContext({
          overwriteOptions: { enabled: true },
          previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
          previousGeneratedPayload: mockPreviousPayload,
        }),
      });

      expect(result).toEqual({
        relativePath: 'file.txt',
        previousRelativePath: 'file.txt',
        mergedContents: Buffer.from(content), // overwrite even when unchanged
        generatedContents: Buffer.from(content),
      });
    });

    it('should respect other options like shouldNeverOverwrite even with overwrite enabled', async () => {
      const workingFiles = new Map([
        ['existing-file.txt', Buffer.from('existing content')],
      ]);

      const result = await prepareGeneratorFile({
        relativePath: 'existing-file.txt',
        data: createMockFileData({
          contents: 'new content',
          options: { shouldNeverOverwrite: true },
        }),
        context: createMockContext({
          overwriteOptions: { enabled: true },
          previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        }),
      });

      expect(result).toEqual({
        relativePath: 'existing-file.txt',
        previousRelativePath: 'existing-file.txt',
        mergedContents: undefined,
        generatedContents: Buffer.from('new content'),
      });
    });

    it('should use applyDiff when provided in overwriteOptions', async () => {
      const workingFiles = new Map([
        ['file.txt', Buffer.from('working content')],
      ]);

      const mockApplyDiff = (
        relativePath: string,
        generatedContents: string | Buffer,
      ): Promise<string | Buffer | undefined | false> => {
        if (relativePath === 'file.txt') {
          return Promise.resolve(`modified: ${String(generatedContents)}`);
        }
        return Promise.resolve(generatedContents);
      };

      const result = await prepareGeneratorFile({
        relativePath: 'file.txt',
        data: createMockFileData({
          contents: 'generated content',
        }),
        context: createMockContext({
          overwriteOptions: { enabled: true, applyDiff: mockApplyDiff },
          previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        }),
      });

      expect(result).toEqual({
        relativePath: 'file.txt',
        previousRelativePath: 'file.txt',
        mergedContents: Buffer.from('modified: generated content'),
        generatedContents: Buffer.from('generated content'),
      });
    });

    it('should skip generation when applyDiff returns undefined', async () => {
      const workingFiles = new Map([
        ['file.txt', Buffer.from('working content')],
      ]);

      const mockApplyDiff = (): Promise<string | Buffer | undefined | false> =>
        Promise.resolve(undefined);

      const result = await prepareGeneratorFile({
        relativePath: 'file.txt',
        data: createMockFileData({
          contents: 'generated content',
        }),
        context: createMockContext({
          overwriteOptions: { enabled: true, applyDiff: mockApplyDiff },
          previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        }),
      });

      expect(result).toEqual({
        relativePath: 'file.txt',
        previousRelativePath: 'file.txt',
        mergedContents: undefined,
        generatedContents: Buffer.from('generated content'),
      });
    });

    it('should skip file when skipFile returns true', async () => {
      const workingFiles = new Map([
        ['file.txt', Buffer.from('working content')],
      ]);

      const mockSkipFile = (relativePath: string): boolean =>
        relativePath === 'file.txt';

      const previousFiles = new Map([
        ['file.txt', Buffer.from('previous content')],
      ]);

      const mockPreviousPayload: PreviousGeneratedPayload = {
        fileReader: createCodebaseReaderFromMemory(previousFiles),
        fileIdToRelativePathMap: new Map([['test-id', 'file.txt']]),
      };

      const result = await prepareGeneratorFile({
        relativePath: 'file.txt',
        data: createMockFileData({
          contents: 'generated content',
        }),
        context: createMockContext({
          overwriteOptions: { enabled: true, skipFile: mockSkipFile },
          previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
          previousGeneratedPayload: mockPreviousPayload,
        }),
      });

      // Should fall back to normal merge behavior when file is skipped
      expect(result.mergedContents).toBeDefined();
      expect(result.generatedContents).toEqual(
        Buffer.from('generated content'),
      );
    });

    it('should skip overwrite when file content is identical after applyDiff', async () => {
      const content = 'identical content';
      const workingFiles = new Map([['file.txt', Buffer.from(content)]]);

      const mockApplyDiff = (
        _relativePath: string,
        generatedContents: string | Buffer,
      ): Promise<string | Buffer | undefined | false> =>
        Promise.resolve(generatedContents); // returns same content

      const result = await prepareGeneratorFile({
        relativePath: 'file.txt',
        data: createMockFileData({
          contents: content,
        }),
        context: createMockContext({
          overwriteOptions: { enabled: true, applyDiff: mockApplyDiff },
          previousWorkingCodebase: createCodebaseReaderFromMemory(workingFiles),
        }),
      });

      expect(result).toEqual({
        relativePath: 'file.txt',
        previousRelativePath: 'file.txt',
        mergedContents: undefined,
        generatedContents: Buffer.from(content),
      });
    });
  });
});
