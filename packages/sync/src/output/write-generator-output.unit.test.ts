import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestLogger } from '#src/tests/logger.test-utils.js';
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
    expect(mockedExecuteCommand.mock.calls[0]?.[0]).toBe('echo "test"');
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
  it("should format against this sync's formatter inputs, not the working tree", async () => {
    vol.fromJSON({
      [`${outputDirectory}/src/styles.css`]: 'stale sheet',
      [`${outputDirectory}/src/component.tsx`]: 'component',
    });

    const sheetsSeen: string[] = [];
    let mirroredPathSeen: string | undefined;

    const output: GeneratorOutput = {
      files: new Map([
        ['src/styles.css', { id: 'styles', contents: 'fresh sheet' }],
        ['src/component.tsx', { id: 'component', contents: 'component' }],
      ]),
      globalFormatters: [
        {
          name: 'stylesheet-aware',
          fileExtensions: ['.tsx', '.css'],
          materializedFormatterInputs: ['src/styles.css'],
          format: (contents, fullPath, _logger, formatOptions) => {
            const mirrored =
              formatOptions?.materializedFormatterInputs?.get('src/styles.css');
            if (mirrored && fullPath.endsWith('component.tsx')) {
              mirroredPathSeen = mirrored;
              sheetsSeen.push(String(vol.readFileSync(mirrored, 'utf8')));
            }
            return contents;
          },
        },
      ],
      postWriteCommands: [],
    };

    await writeGeneratorOutput(output, outputDirectory, { logger });

    // The stylesheet this sync produces, not the one still on disk.
    expect(sheetsSeen).toEqual(['fresh sheet']);
    // The mirror is scoped to the operation and must not outlive it.
    expect(mirroredPathSeen).toBeDefined();
    expect(vol.existsSync(mirroredPathSeen ?? '')).toBe(false);
  });

  it('should mirror an input reached only by another input', async () => {
    vol.fromJSON({});

    const mirrored: string[] = [];

    const output: GeneratorOutput = {
      files: new Map([
        ['src/styles.css', { id: 'styles', contents: "@import './a.css';" }],
        ['src/a.css', { id: 'a', contents: 'imported' }],
      ]),
      globalFormatters: [
        {
          name: 'stylesheet-aware',
          fileExtensions: ['.css'],
          materializedFormatterInputs: ['src/styles.css', 'src/a.css'],
          format: (contents, _fullPath, _logger, formatOptions) => {
            for (const [
              key,
              value,
            ] of formatOptions?.materializedFormatterInputs ?? []) {
              mirrored.push(
                `${key}=${String(vol.readFileSync(value, 'utf8'))}`,
              );
            }
            return contents;
          },
        },
      ],
      postWriteCommands: [],
    };

    await writeGeneratorOutput(output, outputDirectory, { logger });

    // A relative import only resolves from the mirror if it is mirrored too.
    expect(new Set(mirrored)).toEqual(
      new Set(["src/styles.css=@import './a.css';", 'src/a.css=imported']),
    );
  });

  it('should run a post-write command gated on a formatter input the sync creates', async () => {
    mockedExecuteCommand.mockResolvedValue({
      failed: false,
      exitCode: 0,
      output: 'success',
    });
    // A fresh project: nothing on disk, so nothing can be resolved and the
    // in-memory format is degraded. The heal depends on the gate firing for a
    // file this sync creates rather than modifies.
    vol.fromJSON({});

    const output: GeneratorOutput = {
      files: new Map([['src/styles.css', { id: 'styles', contents: 'sheet' }]]),
      globalFormatters: [],
      postWriteCommands: [
        {
          command: 'prettier --write .',
          options: { onlyIfChanged: ['.prettierrc', 'src/styles.css'] },
        },
      ],
    };

    await writeGeneratorOutput(output, outputDirectory, { logger });

    expect(mockedExecuteCommand.mock.calls[0]?.[0]).toBe('prettier --write .');
  });

  it('should re-run formatting after an install triggered by the same sync', async () => {
    mockedExecuteCommand.mockResolvedValue({
      failed: false,
      exitCode: 0,
      output: 'success',
    });
    vol.fromJSON({
      [`${outputDirectory}/package.json`]: '{"name":"app"}',
    });

    const output: GeneratorOutput = {
      files: new Map([
        ['package.json', { id: 'pkg', contents: '{"name":"app","x":1}' }],
      ]),
      globalFormatters: [],
      postWriteCommands: [
        {
          command: 'prettier --write .',
          options: {
            priority: 'FORMATTING',
            onlyIfChanged: ['.prettierrc', 'package.json'],
          },
        },
        {
          command: 'pnpm install',
          options: {
            priority: 'DEPENDENCIES',
            onlyIfChanged: ['package.json'],
          },
        },
      ],
    };

    await writeGeneratorOutput(output, outputDirectory, {
      logger,
      // An upgrade sync: the working file matches the payload, so the
      // dependency change merges cleanly instead of conflicting.
      previousGeneratedPayload: {
        fileReader: createCodebaseReaderFromMemory(
          new Map([['package.json', Buffer.from('{"name":"app"}')]]),
        ),
        fileIdToRelativePathMap: new Map([['pkg', 'package.json']]),
      },
    });

    // The in-memory format may have used the prettier version being replaced,
    // so the heal has to run, and has to run after the install.
    expect(mockedExecuteCommand.mock.calls.map((call) => call[0])).toEqual([
      'pnpm install',
      'prettier --write .',
    ]);
  });
});
