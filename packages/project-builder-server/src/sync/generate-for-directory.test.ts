import type { AppEntry } from '@baseplate-dev/project-builder-lib';
import type { GeneratorEntry } from '@baseplate-dev/sync';
import type { MockedObject } from 'vitest';

import {
  createCodebaseFileReaderFromDirectory,
  createTestLogger,
} from '@baseplate-dev/sync';
import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GeneratorOperations } from './generate-for-directory.js';

import { generateForDirectory } from './generate-for-directory.js';

// Mock the fs module
vi.mock('node:fs');
vi.mock('node:fs/promises');

const mockGeneratorEntry: GeneratorEntry = {
  id: 'test-generator-id',
  scopes: [],
  children: [],
  tasks: [],
  preRegisteredPhases: [],
  generatorInfo: { name: 'test-generator', baseDirectory: '/test' },
};

describe('generateForDirectory', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  const createMockOperations = (): MockedObject<GeneratorOperations> => ({
    buildGeneratorEntry: vi.fn(),
    executeGeneratorEntry: vi.fn(),
    getPreviousGeneratedPayload: vi.fn(),
    writeGeneratorOutput: vi.fn(),
    writeMetadata: vi.fn().mockResolvedValue(undefined),
    writeGeneratorSteps: vi.fn().mockResolvedValue(undefined),
  });

  it('should generate project with mocked operations', async () => {
    // Set up test filesystem
    const testFs = {
      '/test-base/test-app/package.json': JSON.stringify({
        name: 'test-app',
      }),
      '/test-base/test-app/baseplate/generated/file1.txt': 'original content',
      '/test-base/test-app/baseplate/file-id-map.json': JSON.stringify({
        file1: 'file1.txt',
      }),
    };
    vol.fromJSON(testFs, '/');

    // Create test data
    const testLogger = createTestLogger();
    const testAppEntry: AppEntry = {
      id: 'test-app-id',
      name: 'test-app',
      appDirectory: 'test-app',
      generatorBundle: {
        name: 'test-generator',
        directory: '/test',
        tasks: {},
        children: {},
        scopes: [],
      },
    };

    const mockGeneratorOutput = {
      files: new Map([
        ['file1.txt', { contents: Buffer.from('new content'), id: 'file1' }],
        ['file2.txt', { contents: Buffer.from('new file'), id: 'file2' }],
      ]),
      postWriteCommands: [
        { command: 'echo "test"', options: { workingDirectory: 'test-app' } },
      ],
      globalFormatters: [],
      metadata: {
        generatorProviderRelationships: [],
        generatorTaskEntries: [],
      },
    };

    // Create mock operations
    const mockOperations = createMockOperations();
    mockOperations.buildGeneratorEntry.mockResolvedValue(mockGeneratorEntry);
    mockOperations.executeGeneratorEntry.mockResolvedValue(mockGeneratorOutput);
    mockOperations.getPreviousGeneratedPayload.mockResolvedValue({
      fileReader: createCodebaseFileReaderFromDirectory('/test-base/test-app'),
      fileIdToRelativePathMap: new Map([['file1', 'file1.txt']]),
    });
    mockOperations.writeGeneratorOutput.mockResolvedValue({
      fileIdToRelativePathMap: new Map([
        ['file1', 'file1.txt'],
        ['file2', 'file2.txt'],
      ]),
      filesWithConflicts: [],
      failedCommands: [],
    });

    const baseDirectory = '/test-base';

    // Run the test
    const result = await generateForDirectory({
      baseDirectory,
      appEntry: testAppEntry,
      logger: testLogger,
      writeTemplateMetadataOptions: {
        includeTemplateMetadata: true,
        shouldGenerateMetadata: () => true,
      },
      userConfig: { sync: { writeGeneratorStepsJson: true } },
      previousPackageSyncResult: undefined,
      operations: mockOperations,
    });

    // Verify results
    expect(result).toEqual({
      completedAt: expect.any(String) as string,
      filesWithConflicts: [],
      failedCommands: [],
    });
    expect(testLogger.getInfoOutput()).toContain(
      'Project successfully generated!',
    );

    // Verify function calls
    expect(mockOperations.buildGeneratorEntry).toHaveBeenCalledWith(
      testAppEntry.generatorBundle,
    );
    expect(mockOperations.executeGeneratorEntry).toHaveBeenCalledWith(
      mockGeneratorEntry,
      expect.objectContaining({
        templateMetadataOptions: expect.any(Object) as unknown,
      }),
    );
    expect(mockOperations.getPreviousGeneratedPayload).toHaveBeenCalledWith(
      '/test-base/test-app',
    );
    expect(mockOperations.writeGeneratorOutput).toHaveBeenCalledWith(
      mockGeneratorOutput,
      '/test-base/test-app',
      expect.objectContaining({
        previousGeneratedPayload: expect.any(Object) as unknown,
        generatedContentsDirectory:
          '/test-base/test-app/baseplate/build/generated_tmp',
      }),
    );
    expect(mockOperations.writeMetadata).toHaveBeenCalled();
    expect(mockOperations.writeGeneratorSteps).toHaveBeenCalled();
  });

  it('should handle conflicts and failed commands', async () => {
    // Set up test filesystem
    const testFs = {
      '/test-base/test-app/package.json': JSON.stringify({
        name: 'test-app',
      }),
      '/test-base/test-app/baseplate/generated/conflict.txt':
        'original content',
      '/test-base/test-app/baseplate/file-id-map.json': JSON.stringify({
        file1: 'conflict.txt',
      }),
    };
    vol.fromJSON(testFs, '/');

    // Create test data
    const testLogger = createTestLogger();
    const testAppEntry: AppEntry = {
      id: 'test-app-id',
      name: 'test-app',
      appDirectory: 'test-app',
      generatorBundle: {
        name: 'test-generator',
        directory: '/test',
        tasks: {},
        children: {},
        scopes: [],
      },
    };

    const mockGeneratorOutput = {
      files: new Map([
        ['conflict.txt', { contents: Buffer.from('new content'), id: 'file1' }],
      ]),
      postWriteCommands: [
        { command: 'npm install', options: { workingDirectory: 'test-app' } },
      ],
      globalFormatters: [],
      metadata: {
        generatorProviderRelationships: [],
        generatorTaskEntries: [],
      },
    };

    // Create mock operations that simulate conflicts and failed commands
    const mockOperations = createMockOperations();
    mockOperations.buildGeneratorEntry.mockResolvedValue(mockGeneratorEntry);
    mockOperations.executeGeneratorEntry.mockResolvedValue(mockGeneratorOutput);
    mockOperations.getPreviousGeneratedPayload.mockResolvedValue({
      fileReader: createCodebaseFileReaderFromDirectory('/test-base/test-app'),
      fileIdToRelativePathMap: new Map([['file1', 'conflict.txt']]),
    });
    mockOperations.writeGeneratorOutput.mockResolvedValue({
      fileIdToRelativePathMap: new Map([['file1', 'conflict.txt']]),
      filesWithConflicts: [
        { relativePath: 'conflict.txt', conflictType: 'merge-conflict' },
        {
          relativePath: 'generated-deleted.txt',
          conflictType: 'generated-deleted',
        },
        {
          relativePath: 'working-deleted.txt',
          conflictType: 'working-deleted',
        },
      ],
      failedCommands: [{ command: 'npm install', workingDir: '/test-app' }],
    });

    const baseDirectory = '/test-base';

    // Run the test
    const result = await generateForDirectory({
      baseDirectory,
      appEntry: testAppEntry,
      logger: testLogger,
      userConfig: { sync: { writeGeneratorStepsJson: false } },
      previousPackageSyncResult: undefined,
      operations: mockOperations,
    });

    // Verify results
    expect(result).toEqual({
      completedAt: expect.any(String) as string,
      filesWithConflicts: [
        { relativePath: 'conflict.txt', conflictType: 'merge-conflict' },
        {
          relativePath: 'generated-deleted.txt',
          conflictType: 'generated-deleted',
        },
        {
          relativePath: 'working-deleted.txt',
          conflictType: 'working-deleted',
        },
      ],
      failedCommands: [
        {
          id: expect.any(String) as string,
          command: 'npm install',
          workingDir: '/test-app',
          output: undefined,
        },
      ],
    });
    expect(testLogger.getWarnOutput()).toContain(
      'Merge conflicts occurred while writing files',
    );
    expect(testLogger.getWarnOutput()).toContain(
      'Files were deleted in the new generation but were modified by user so could not be automatically deleted:',
    );
    expect(testLogger.getWarnOutput()).toContain(
      'Files were deleted by user but were added back in the new generation so should be reviewed:',
    );
  });

  it('should swap generated directories correctly', async () => {
    // Set up test filesystem
    const testFs = {
      '/test-base/test-app/package.json': JSON.stringify({
        name: 'test-app',
      }),
      '/test-base/test-app/baseplate/generated/file1.txt': 'original content',
      '/test-base/test-app/baseplate/file-id-map.json': JSON.stringify({
        file1: 'file1.txt',
      }),
    };
    vol.fromJSON(testFs, '/');

    // Create test data
    const testLogger = createTestLogger();
    const testAppEntry: AppEntry = {
      id: 'test-app-id',
      name: 'test-app',
      appDirectory: 'test-app',
      generatorBundle: {
        name: 'test-generator',
        directory: '/test',
        tasks: {},
        children: {},
        scopes: [],
      },
    };

    const mockGeneratorOutput = {
      files: new Map([
        ['file1.txt', { contents: Buffer.from('new content'), id: 'file1' }],
      ]),
      postWriteCommands: [],
      globalFormatters: [],
      metadata: {
        generatorProviderRelationships: [],
        generatorTaskEntries: [],
      },
    };

    // Create mock operations
    const mockOperations = createMockOperations();
    mockOperations.buildGeneratorEntry.mockResolvedValue(mockGeneratorEntry);
    mockOperations.executeGeneratorEntry.mockResolvedValue(mockGeneratorOutput);
    mockOperations.getPreviousGeneratedPayload.mockResolvedValue({
      fileReader: createCodebaseFileReaderFromDirectory('/test-base/test-app'),
      fileIdToRelativePathMap: new Map([['file1', 'file1.txt']]),
    });
    mockOperations.writeGeneratorOutput.mockImplementation(
      async (output, outputDirectory, { generatedContentsDirectory } = {}) => {
        if (generatedContentsDirectory) {
          await vol.promises.writeFile(
            path.join(generatedContentsDirectory, 'file1.txt'),
            Buffer.from('new content'),
          );
        }
        return {
          fileIdToRelativePathMap: new Map([['file1', 'file1.txt']]),
          filesWithConflicts: [],
          failedCommands: [],
          relativePathsPendingDelete: [],
        };
      },
    );

    const baseDirectory = '/test-base';

    // Run the test
    await generateForDirectory({
      baseDirectory,
      appEntry: testAppEntry,
      logger: testLogger,
      userConfig: { sync: { writeGeneratorStepsJson: false } },
      previousPackageSyncResult: undefined,
      operations: mockOperations,
    });

    expect(
      vol.readFileSync('/test-base/test-app/baseplate/generated/file1.txt'),
    ).toEqual(Buffer.from('new content'));
  });
});

// TODO [>=0.2.0] Remove this once we've released a new major version.
describe('generateForDirectory with migration', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  const createMockOperations = (): MockedObject<GeneratorOperations> => ({
    buildGeneratorEntry: vi.fn(),
    executeGeneratorEntry: vi.fn(),
    getPreviousGeneratedPayload: vi.fn(),
    writeGeneratorOutput: vi.fn(),
    writeMetadata: vi.fn().mockResolvedValue(undefined),
    writeGeneratorSteps: vi.fn().mockResolvedValue(undefined),
  });

  const testAppEntry: AppEntry = {
    id: 'test-app-id',
    name: 'test-app',
    appDirectory: 'test-app',
    generatorBundle: {
      name: 'test-generator',
      directory: '/test',
      tasks: {},
      children: {},
      scopes: [],
    },
  };

  const baseDirectory = '/test-base';
  const projectDirectory = path.join(baseDirectory, testAppEntry.appDirectory);
  const defaultUserConfig = { sync: { writeGeneratorStepsJson: false } };

  it('should migrate .clean directory if only .clean exists', async () => {
    const testLogger = createTestLogger();
    const mockOperations = createMockOperations();

    const testFs = {
      [path.join(projectDirectory, 'package.json')]: JSON.stringify({
        name: 'test-app',
      }),
      [path.join(projectDirectory, 'baseplate/.clean/original.txt')]:
        'old content',
      [path.join(projectDirectory, 'baseplate/file-id-map.json')]:
        JSON.stringify({ 'original.txt': 'original.txt' }),
    };
    vol.fromJSON(testFs, '/');

    mockOperations.buildGeneratorEntry.mockResolvedValue(mockGeneratorEntry);
    mockOperations.executeGeneratorEntry.mockResolvedValue({
      files: new Map([
        [
          'output_file.txt',
          { contents: Buffer.from('final output'), id: 'output_file.txt' },
        ],
      ]),
      postWriteCommands: [],
      globalFormatters: [],
      metadata: {
        generatorProviderRelationships: [],
        generatorTaskEntries: [],
      },
    });

    // Mock should check for the migrated directory
    mockOperations.getPreviousGeneratedPayload.mockImplementation(
      (projectDir) => {
        // After migration, check if generated exists (from migration) or .clean exists (pre-migration)
        const generatedPath = path.join(projectDir, 'baseplate/generated');
        const cleanPath = path.join(projectDir, 'baseplate/.clean');

        if (vol.existsSync(generatedPath)) {
          return Promise.resolve({
            fileReader: createCodebaseFileReaderFromDirectory(generatedPath),
            fileIdToRelativePathMap: new Map([
              ['original.txt', 'original.txt'],
            ]),
          });
        } else if (vol.existsSync(cleanPath)) {
          return Promise.resolve({
            fileReader: createCodebaseFileReaderFromDirectory(cleanPath),
            fileIdToRelativePathMap: new Map([
              ['original.txt', 'original.txt'],
            ]),
          });
        }
        return Promise.resolve(undefined);
      },
    );

    mockOperations.writeGeneratorOutput.mockImplementation(
      async (
        _output,
        _outputDir,
        { generatedContentsDirectory, previousGeneratedPayload } = {},
      ) => {
        if (generatedContentsDirectory) {
          // Write new file
          await vol.promises.writeFile(
            path.join(generatedContentsDirectory, 'output_file.txt'),
            'final output',
          );

          // Copy existing file from previous generated (simulating merge)
          if (previousGeneratedPayload) {
            await vol.promises.writeFile(
              path.join(generatedContentsDirectory, 'original.txt'),
              'old content',
            );
          }
        }
        return {
          fileIdToRelativePathMap: new Map([
            ['output_file.txt', 'output_file.txt'],
            ['original.txt', 'original.txt'],
          ]),
          filesWithConflicts: [],
          failedCommands: [],
        };
      },
    );

    await generateForDirectory({
      baseDirectory,
      appEntry: testAppEntry,
      logger: testLogger,
      userConfig: defaultUserConfig,
      previousPackageSyncResult: undefined,
      operations: mockOperations,
    });

    expect(
      vol.existsSync(path.join(projectDirectory, 'baseplate/.clean')),
    ).toBe(false);
    expect(
      vol.existsSync(
        path.join(projectDirectory, 'baseplate/generated/original.txt'),
      ),
    ).toBe(true);
    expect(testLogger.getInfoOutput()).toContain(
      'Migrating legacy .clean directory',
    );
  });

  it('should not migrate if only generated directory exists', async () => {
    const testLogger = createTestLogger();
    const mockOperations = createMockOperations();

    const testFs = {
      [path.join(projectDirectory, 'package.json')]: JSON.stringify({
        name: 'test-app',
      }),
      [path.join(projectDirectory, 'baseplate/generated/existing.txt')]:
        'new content',
      [path.join(projectDirectory, 'baseplate/file-id-map.json')]:
        JSON.stringify({ 'existing.txt': 'existing.txt' }),
    };
    vol.fromJSON(testFs, '/');

    mockOperations.buildGeneratorEntry.mockResolvedValue(mockGeneratorEntry);
    mockOperations.executeGeneratorEntry.mockResolvedValue({
      files: new Map([
        [
          'output_file.txt',
          { contents: Buffer.from('final output'), id: 'output_file.txt' },
        ],
      ]),
      postWriteCommands: [],
      globalFormatters: [],
      metadata: {
        generatorProviderRelationships: [],
        generatorTaskEntries: [],
      },
    });
    mockOperations.getPreviousGeneratedPayload.mockResolvedValue({
      fileReader: createCodebaseFileReaderFromDirectory(
        path.join(projectDirectory, 'baseplate/generated'),
      ),
      fileIdToRelativePathMap: new Map([['existing.txt', 'existing.txt']]),
    });
    mockOperations.writeGeneratorOutput.mockImplementation(
      async (
        _output,
        _outputDir,
        { generatedContentsDirectory, previousGeneratedPayload } = {},
      ) => {
        if (generatedContentsDirectory) {
          await vol.promises.writeFile(
            path.join(generatedContentsDirectory, 'output_file.txt'),
            'final output',
          );

          // Preserve existing file
          if (previousGeneratedPayload) {
            await vol.promises.writeFile(
              path.join(generatedContentsDirectory, 'existing.txt'),
              'new content',
            );
          }
        }
        return {
          fileIdToRelativePathMap: new Map([
            ['output_file.txt', 'output_file.txt'],
            ['existing.txt', 'existing.txt'],
          ]),
          filesWithConflicts: [],
          failedCommands: [],
        };
      },
    );

    await generateForDirectory({
      baseDirectory,
      appEntry: testAppEntry,
      logger: testLogger,
      userConfig: defaultUserConfig,
      previousPackageSyncResult: undefined,
      operations: mockOperations,
    });

    expect(
      vol.existsSync(path.join(projectDirectory, 'baseplate/.clean')),
    ).toBe(false);
    expect(
      vol.existsSync(
        path.join(projectDirectory, 'baseplate/generated/existing.txt'),
      ),
    ).toBe(true);
    expect(
      vol.existsSync(
        path.join(projectDirectory, 'baseplate/generated/output_file.txt'),
      ),
    ).toBe(true);
    expect(testLogger.getInfoOutput()).not.toContain(
      'Migrating legacy .clean directory',
    );
  });

  it('should attempt migration when both .clean and generated exist', async () => {
    const testLogger = createTestLogger();
    const mockOperations = createMockOperations();

    const testFs = {
      [path.join(projectDirectory, 'package.json')]: JSON.stringify({
        name: 'test-app',
      }),
      [path.join(projectDirectory, 'baseplate/.clean/original_old.txt')]:
        'old content',
      [path.join(projectDirectory, 'baseplate/generated/existing_new.txt')]:
        'new content',
      [path.join(projectDirectory, 'baseplate/file-id-map.json')]:
        JSON.stringify({ 'existing_new.txt': 'existing_new.txt' }),
    };
    vol.fromJSON(testFs, '/');

    mockOperations.buildGeneratorEntry.mockResolvedValue(mockGeneratorEntry);
    mockOperations.executeGeneratorEntry.mockResolvedValue({
      files: new Map([
        [
          'output_file.txt',
          { contents: Buffer.from('final output'), id: 'output_file.txt' },
        ],
      ]),
      postWriteCommands: [],
      globalFormatters: [],
      metadata: {
        generatorProviderRelationships: [],
        generatorTaskEntries: [],
      },
    });
    // getPreviousGeneratedPayload will be called with the new dir because it exists
    mockOperations.getPreviousGeneratedPayload.mockResolvedValue({
      fileReader: createCodebaseFileReaderFromDirectory(
        path.join(projectDirectory, 'baseplate/generated'),
      ),
      fileIdToRelativePathMap: new Map([
        ['existing_new.txt', 'existing_new.txt'],
      ]),
    });
    mockOperations.writeGeneratorOutput.mockImplementation(
      async (
        _output,
        _outputDir,
        { generatedContentsDirectory, previousGeneratedPayload } = {},
      ) => {
        if (generatedContentsDirectory) {
          // Simulate writing a new file
          await vol.promises.writeFile(
            path.join(generatedContentsDirectory, 'output_file.txt'),
            'final output',
          );

          // Preserve existing file from generated directory
          if (previousGeneratedPayload) {
            await vol.promises.writeFile(
              path.join(generatedContentsDirectory, 'existing_new.txt'),
              'new content',
            );
          }
        }
        return {
          fileIdToRelativePathMap: new Map([
            ['output_file.txt', 'output_file.txt'],
            ['existing_new.txt', 'existing_new.txt'],
          ]),
          filesWithConflicts: [],
          failedCommands: [],
        };
      },
    );

    await expect(
      generateForDirectory({
        baseDirectory,
        appEntry: testAppEntry,
        logger: testLogger,
        userConfig: defaultUserConfig,
        previousPackageSyncResult: undefined,
        operations: mockOperations,
      }),
    ).rejects.toThrow('New generated directory already exists');
  });

  it('should not attempt migration if neither directory exists', async () => {
    const testLogger = createTestLogger();
    const mockOperations = createMockOperations();

    const testFs = {
      [path.join(projectDirectory, 'someotherfile.txt')]: 'content',
      // No file-id-map.json, as no previous generated dir
    };
    vol.fromJSON(testFs, '/');

    mockOperations.buildGeneratorEntry.mockResolvedValue(mockGeneratorEntry);
    mockOperations.executeGeneratorEntry.mockResolvedValue({
      files: new Map([
        [
          'output_file.txt',
          { contents: Buffer.from('final output'), id: 'output_file.txt' },
        ],
      ]),
      postWriteCommands: [],
      globalFormatters: [],
      metadata: {
        generatorProviderRelationships: [],
        generatorTaskEntries: [],
      },
    });
    // getPreviousGeneratedPayload is called, but will return undefined
    mockOperations.getPreviousGeneratedPayload.mockResolvedValue(undefined);
    mockOperations.writeGeneratorOutput.mockImplementation(
      async (_output, _outputDir, { generatedContentsDirectory } = {}) => {
        if (generatedContentsDirectory) {
          await vol.promises.writeFile(
            path.join(generatedContentsDirectory, 'output_file.txt'),
            'final output',
          );
        }
        return {
          fileIdToRelativePathMap: new Map([
            ['output_file.txt', 'output_file.txt'],
          ]),
          filesWithConflicts: [],
          failedCommands: [],
        };
      },
    );

    await generateForDirectory({
      baseDirectory,
      appEntry: testAppEntry,
      logger: testLogger,
      userConfig: defaultUserConfig,
      previousPackageSyncResult: undefined,
      operations: mockOperations,
    });

    expect(
      vol.existsSync(path.join(projectDirectory, 'baseplate/.clean')),
    ).toBe(false);
    expect(
      vol.existsSync(
        path.join(projectDirectory, 'baseplate/generated/output_file.txt'),
      ),
    ).toBe(true); // Normal generation occurred
    expect(testLogger.getInfoOutput()).not.toContain(
      'Migrating legacy .clean directory',
    );
  });
});
