import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '#src/utils/index.js';

import type { GeneratorOutputFormatter } from './formatter.js';
import type { GeneratorTaskOutput } from './generator-task-output.js';

import { formatGeneratorOutput } from './format-generator-output.js';

// Mock the formatOutputFileContents function
vi.mock('./prepare-generator-files/prepare-generator-file.js', () => ({
  formatOutputFileContents: vi.fn(),
}));

const { formatOutputFileContents } =
  await import('./prepare-generator-files/prepare-generator-file.js');

describe('formatGeneratorOutput', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockFormatter: GeneratorOutputFormatter = {
    name: 'test-formatter',
    fileExtensions: ['.ts', '.js'],
    format: vi.fn().mockResolvedValue('formatted content'),
  };

  const mockGeneratorOutput: GeneratorTaskOutput = {
    files: new Map([
      ['file1.ts', { id: 'file1', contents: 'original content 1' }],
      ['file2.js', { id: 'file2', contents: 'original content 2' }],
      ['file3.txt', { id: 'file3', contents: 'original content 3' }],
    ]),
    postWriteCommands: [{ command: 'test-command' }],
    globalFormatters: [mockFormatter],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return the expected value
    vi.mocked(formatOutputFileContents).mockResolvedValue('formatted content');
  });

  it('should format all files in the generator output', async () => {
    // Arrange
    const options = {
      outputDirectory: '/test/output',
      logger: mockLogger,
    };

    // Act
    const result = await formatGeneratorOutput(mockGeneratorOutput, options);

    // Assert
    expect(formatOutputFileContents).toHaveBeenCalledTimes(3);
    expect(formatOutputFileContents).toHaveBeenCalledWith(
      'file1.ts',
      { id: 'file1', contents: 'original content 1' },
      {
        outputDirectory: '/test/output',
        formatters: [mockFormatter],
        logger: mockLogger,
      },
    );
    expect(formatOutputFileContents).toHaveBeenCalledWith(
      'file2.js',
      { id: 'file2', contents: 'original content 2' },
      {
        outputDirectory: '/test/output',
        formatters: [mockFormatter],
        logger: mockLogger,
      },
    );
    expect(formatOutputFileContents).toHaveBeenCalledWith(
      'file3.txt',
      { id: 'file3', contents: 'original content 3' },
      {
        outputDirectory: '/test/output',
        formatters: [mockFormatter],
        logger: mockLogger,
      },
    );

    expect(result.files.size).toBe(3);
    expect(result.files.get('file1.ts')).toEqual({
      id: 'file1',
      contents: 'formatted content',
      options: undefined,
    });
    expect(result.files.get('file2.js')).toEqual({
      id: 'file2',
      contents: 'formatted content',
      options: undefined,
    });
    expect(result.files.get('file3.txt')).toEqual({
      id: 'file3',
      contents: 'formatted content',
      options: undefined,
    });
    expect(result.postWriteCommands).toEqual([{ command: 'test-command' }]);
    expect(result.globalFormatters).toEqual([mockFormatter]);
  });

  it('should preserve file options when formatting', async () => {
    // Arrange
    const outputWithOptions: GeneratorTaskOutput = {
      files: new Map([
        [
          'file1.ts',
          {
            id: 'file1',
            contents: 'original content',
            options: { skipFormatting: true },
          },
        ],
      ]),
      postWriteCommands: [],
      globalFormatters: [mockFormatter],
    };

    const options = {
      outputDirectory: '/test/output',
      logger: mockLogger,
    };

    // Act
    const result = await formatGeneratorOutput(outputWithOptions, options);

    // Assert
    expect(result.files.get('file1.ts')).toEqual({
      id: 'file1',
      contents: 'formatted content',
      options: { skipFormatting: true },
    });
  });

  it('should handle empty files map', async () => {
    // Arrange
    const emptyOutput: GeneratorTaskOutput = {
      files: new Map(),
      postWriteCommands: [],
      globalFormatters: [],
    };

    const options = {
      outputDirectory: '/test/output',
      logger: mockLogger,
    };

    // Act
    const result = await formatGeneratorOutput(emptyOutput, options);

    // Assert
    expect(formatOutputFileContents).not.toHaveBeenCalled();
    expect(result.files.size).toBe(0);
    expect(result.postWriteCommands).toEqual([]);
    expect(result.globalFormatters).toEqual([]);
  });
});
