import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GeneratorFileOperationResult } from '../prepare-generator-files/types.js';

import { WriteGeneratorFilesError } from './errors.js';
import { writeGeneratorFiles } from './write-generator-files.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('writeGeneratorFiles', () => {
  const outputDirectory = '/root';

  it('should write multiple files in parallel', async () => {
    const fileOperations: GeneratorFileOperationResult[] = [
      {
        relativePath: 'file1.txt',
        previousRelativePath: 'file1.txt',
        mergedContents: Buffer.from('content 1'),
        generatedContents: Buffer.from('content 1'),
      },
      {
        relativePath: 'nested/file2.txt',
        previousRelativePath: 'nested/file2.txt',
        mergedContents: Buffer.from('content 2'),
        generatedContents: Buffer.from('content 2'),
      },
    ];

    await writeGeneratorFiles({
      fileOperations,
      outputDirectory,
    });

    expect(vol.toJSON()).toEqual({
      '/root/file1.txt': 'content 1',
      '/root/nested/file2.txt': 'content 2',
    });
  });

  it('should handle empty file operations array', async () => {
    await writeGeneratorFiles({
      fileOperations: [],
      outputDirectory,
    });

    expect(vol.toJSON()).toEqual({});
  });

  it('should collect and throw multiple errors', async () => {
    // Create an invalid state that will cause errors
    vol.fromJSON({
      '/root': 'this is a file, not a directory',
    });

    const fileOperations: GeneratorFileOperationResult[] = [
      {
        relativePath: 'file1.txt',
        previousRelativePath: 'file1.txt',
        mergedContents: Buffer.from('content 1'),
        generatedContents: Buffer.from('content 1'),
      },
      {
        relativePath: 'file2.txt',
        previousRelativePath: 'file2.txt',
        mergedContents: Buffer.from('content 2'),
        generatedContents: Buffer.from('content 2'),
      },
    ];

    const error = await writeGeneratorFiles({
      fileOperations,
      outputDirectory,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(WriteGeneratorFilesError);
    const { errors } = error as WriteGeneratorFilesError;
    expect(errors.length).toBe(2);
    expect(errors[0].relativePath).toBe('file1.txt');
    expect(errors[1].relativePath).toBe('file2.txt');

    // Verify files remain unchanged
    expect(vol.toJSON()).toEqual({
      '/root': 'this is a file, not a directory',
    });
  });

  it('should write to generated contents directory when specified', async () => {
    const fileOperations: GeneratorFileOperationResult[] = [
      {
        relativePath: 'test.txt',
        previousRelativePath: 'test.txt',
        mergedContents: Buffer.from('merged'),
        generatedContents: Buffer.from('generated'),
      },
    ];

    await writeGeneratorFiles({
      fileOperations,
      outputDirectory,
      generatedContentsDirectory: '/generated',
    });

    expect(vol.toJSON()).toEqual({
      '/root/test.txt': 'merged',
      '/generated/test.txt': 'generated',
    });
  });
});
