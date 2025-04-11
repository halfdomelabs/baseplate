import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestLogger } from '@src/tests/logger.test-helper.js';

import type { GeneratorOutput } from './generator-task-output.js';

import { executeCommand } from '../utils/exec.js';
import { PrepareGeneratorFilesError } from './prepare-generator-files/errors.js';
import { writeGeneratorOutput } from './write-generator-output.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

vi.mock('../utils/exec.js');

const mockedExecuteCommand = vi.mocked(executeCommand);

describe('writeGeneratorOutput', () => {
  const outputDirectory = '/test/output';
  const logger = createTestLogger();

  beforeEach(() => {
    vol.reset();
  });

  it('should successfully write files and run commands', async () => {
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
    expect(result.relativePathsWithConflicts).toHaveLength(0);
    expect(result.failedCommands).toHaveLength(0);
    expect(result.fileIdToRelativePathMap.size).toBe(2);
    expect(result.fileIdToRelativePathMap.get('test-1')).toBe('test.txt');
    expect(result.fileIdToRelativePathMap.get('test-2')).toBe(
      'nested/file.txt',
    );
    expect(mockedExecuteCommand.mock.calls[0][0]).toBe('echo "test"');
  });

  it('should handle conflicts and return failed commands', async () => {
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
    expect(result.relativePathsWithConflicts).toContain('test.txt');
    expect(result.failedCommands).toContain('format');
    expect(result.fileIdToRelativePathMap.size).toBe(1);
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
