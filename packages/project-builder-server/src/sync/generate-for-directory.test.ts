import type { AppEntry } from '@halfdomelabs/project-builder-lib';
import type { GeneratorEntry } from '@halfdomelabs/sync';
import type { MockedObject } from 'vitest';

import {
  createCodebaseFileReaderFromDirectory,
  createTestLogger,
} from '@halfdomelabs/sync';
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
      '/test-base/test-app/baseplate/.clean/file1.txt': 'original content',
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
      relativePathsPendingDelete: [],
    });

    const baseDirectory = '/test-base';

    // Run the test
    const result = await generateForDirectory({
      baseDirectory,
      appEntry: testAppEntry,
      logger: testLogger,
      shouldWriteTemplateMetadata: true,
      userConfig: { sync: { writeGeneratorStepsJson: true } },
      previousPackageSyncResult: undefined,
      operations: mockOperations,
    });

    // Verify results
    expect(result).toEqual({
      completedAt: expect.any(String) as string,
      filesWithConflicts: [],
      failedCommands: [],
      filesPendingDelete: [],
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
      '/test-base/test-app/baseplate/.clean/conflict.txt': 'original content',
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
      filesWithConflicts: [{ relativePath: 'conflict.txt' }],
      failedCommands: [{ command: 'npm install', workingDir: '/test-app' }],
      relativePathsPendingDelete: ['deleted.txt'],
    });

    const baseDirectory = '/test-base';

    // Run the test
    const result = await generateForDirectory({
      baseDirectory,
      appEntry: testAppEntry,
      logger: testLogger,
      shouldWriteTemplateMetadata: false,
      userConfig: { sync: { writeGeneratorStepsJson: false } },
      previousPackageSyncResult: undefined,
      operations: mockOperations,
    });

    // Verify results
    expect(result).toEqual({
      completedAt: expect.any(String) as string,
      filesWithConflicts: [{ relativePath: 'conflict.txt', resolved: false }],
      failedCommands: [
        {
          id: expect.any(String) as string,
          command: 'npm install',
          workingDir: '/test-app',
          output: undefined,
        },
      ],
      filesPendingDelete: [{ relativePath: 'deleted.txt', resolved: false }],
    });
    expect(testLogger.getWarnOutput()).toContain(
      'Conflicts occurred while writing files',
    );
    expect(testLogger.getWarnOutput()).toContain(
      'Files were removed in the new generation',
    );
  });

  it('should swap generated directories correctly', async () => {
    // Set up test filesystem
    const testFs = {
      '/test-base/test-app/package.json': JSON.stringify({
        name: 'test-app',
      }),
      '/test-base/test-app/baseplate/.clean/file1.txt': 'original content',
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
      shouldWriteTemplateMetadata: false,
      userConfig: { sync: { writeGeneratorStepsJson: false } },
      previousPackageSyncResult: undefined,
      operations: mockOperations,
    });

    expect(
      vol.readFileSync('/test-base/test-app/baseplate/.clean/file1.txt'),
    ).toEqual(Buffer.from('new content'));
  });
});
