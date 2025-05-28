import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestLogger } from '#src/tests/logger.test-helper.js';
import { executeCommand } from '#src/utils/exec.js';

import type { GeneratorOutput } from './generator-task-output.js';

import { createCodebaseReaderFromMemory } from './codebase-file-reader.js';
import { PrepareGeneratorFilesError } from './errors.js';
import { writeGeneratorOutput } from './write-generator-output.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

vi.mock('#src/utils/exec.js');

const mockedExecuteCommand = vi.mocked(executeCommand);

describe('writeGeneratorOutput', () => {
  const outputDirectory = '/test/output';
  const logger = createTestLogger();

  beforeEach(() => {
    vol.reset();
  });

  it('should successfully write files and run commands', async () => {
    mockedExecuteCommand.mockResolvedValue({
      failed: false,
      exitCode: 0,
      output: 'success',
    });
    // Setup test files
    vol.fromJSON({
      [outputDirectory]: null, // Create directory
    });

    const output: GeneratorOutput = {
      files: new Map([
        [
          'test.txt',
          {
            id: 'test-1',
            contents: 'test content',
          },
        ],
        [
          'nested/file.txt',
          {
            id: 'test-2',
            contents: 'nested content',
          },
        ],
      ]),
      globalFormatters: [],
      postWriteCommands: [
        {
          command: 'echo "test"',
          options: {},
        },
      ],
    };

    const result = await writeGeneratorOutput(output, outputDirectory, {
      logger,
    });

    // Verify successful result
    expect(result.filesWithConflicts).toHaveLength(0);
    expect(result.failedCommands).toHaveLength(0);
    expect(result.fileIdToRelativePathMap.size).toBe(2);
    expect(result.fileIdToRelativePathMap.get('test-1')).toBe('test.txt');
    expect(result.fileIdToRelativePathMap.get('test-2')).toBe(
      'nested/file.txt',
    );
    expect(mockedExecuteCommand.mock.calls[0][0]).toBe('echo "test"');
  });

  it('should handle merge conflicts and return failed commands', async () => {
    mockedExecuteCommand.mockRejectedValue(new Error('test error'));
    // Setup test files with conflicting content
    vol.fromJSON({
      [`${outputDirectory}/test.txt`]: 'existing conflicting content',
    });

    const output: GeneratorOutput = {
      files: new Map([
        [
          'test.txt',
          {
            id: 'test-1',
            contents: 'new content',
          },
        ],
      ]),
      globalFormatters: [],
      postWriteCommands: [
        {
          command: 'format',
          options: {},
        },
      ],
    };

    const result = await writeGeneratorOutput(output, outputDirectory, {
      logger,
    });

    // Verify conflict handling
    expect(result.filesWithConflicts).toEqual([
      {
        relativePath: 'test.txt',
        generatedConflictRelativePath: undefined,
        conflictType: 'merge-conflict',
      },
    ]);
    expect(result.failedCommands).toEqual([
      {
        command: 'format',
        workingDir: outputDirectory,
      },
    ]);
    expect(result.fileIdToRelativePathMap.size).toBe(1);
  });

  it('should handle working-deleted conflicts', async () => {
    // Setup test files with a file that was deleted in working directory
    vol.fromJSON({});

    const output: GeneratorOutput = {
      files: new Map([
        [
          'test.txt',
          {
            id: 'test-1',
            contents: 'new content',
          },
        ],
      ]),
      globalFormatters: [],
      postWriteCommands: [],
    };

    const result = await writeGeneratorOutput(output, outputDirectory, {
      logger,
      previousGeneratedPayload: {
        fileReader: createCodebaseReaderFromMemory(
          new Map([['test.txt', Buffer.from('other content')]]),
        ),
        fileIdToRelativePathMap: new Map([['test-1', 'test.txt']]),
      },
    });

    expect(result.filesWithConflicts).toEqual([
      {
        relativePath: 'test.txt',
        conflictType: 'working-deleted',
      },
    ]);
  });

  it('should handle generated-deleted conflicts', async () => {
    vol.fromJSON({
      [`${outputDirectory}/test.txt`]: 'existing content',
    });

    const previousGeneratedPayload = {
      fileReader: createCodebaseReaderFromMemory(
        new Map([['test.txt', Buffer.from('other content')]]),
      ),
      fileIdToRelativePathMap: new Map([['test-1', 'test.txt']]),
    };

    const output: GeneratorOutput = {
      files: new Map(),
      globalFormatters: [],
      postWriteCommands: [],
    };

    const result = await writeGeneratorOutput(output, outputDirectory, {
      logger,
      previousGeneratedPayload,
    });

    expect(result.filesWithConflicts).toEqual([
      {
        relativePath: 'test.txt',
        conflictType: 'generated-deleted',
      },
    ]);
  });

  it('should write to generated contents directory when specified', async () => {
    vol.fromJSON({});

    const output: GeneratorOutput = {
      files: new Map([
        [
          'test.txt',
          {
            id: 'test-1',
            contents: 'test content',
          },
        ],
      ]),
      globalFormatters: [],
      postWriteCommands: [],
    };

    await writeGeneratorOutput(output, outputDirectory, {
      logger,
      generatedContentsDirectory: '/generated',
    });

    // Verify files were written to both directories
    expect(vol.readFileSync(`${outputDirectory}/test.txt`, 'utf8')).toBe(
      'test content',
    );
    expect(vol.readFileSync('/generated/test.txt', 'utf8')).toBe(
      'test content',
    );
  });

  it('should handle formatter errors gracefully', async () => {
    const output: GeneratorOutput = {
      files: new Map([
        [
          'test.txt',
          {
            id: 'test-1',
            contents: 'invalid content',
          },
        ],
      ]),
      globalFormatters: [
        {
          name: 'test-formatter',
          fileExtensions: ['.txt'],
          format: () => {
            throw new Error('Formatting failed');
          },
        },
      ],
      postWriteCommands: [],
    };

    await expect(
      writeGeneratorOutput(output, outputDirectory, { logger }),
    ).rejects.toThrow(PrepareGeneratorFilesError);
  });

  it('should skip formatting if skipFormatting is true', async () => {
    const output: GeneratorOutput = {
      files: new Map([
        [
          'test.txt',
          {
            id: 'test-1',
            contents: 'no formatting content',
            options: {
              skipFormatting: true,
            },
          },
        ],
      ]),
      globalFormatters: [
        {
          name: 'test-formatter',
          fileExtensions: ['.txt'],
          format: () => {
            throw new Error('Formatting failed');
          },
        },
      ],
      postWriteCommands: [],
    };

    await writeGeneratorOutput(output, outputDirectory, { logger });

    expect(vol.readFileSync(`${outputDirectory}/test.txt`, 'utf8')).toBe(
      'no formatting content',
    );
  });
});
