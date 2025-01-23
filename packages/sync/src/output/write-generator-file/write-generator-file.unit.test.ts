import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GeneratorFileOperationResult } from '../prepare-generator-files/types.js';

import { writeGeneratorFile } from './write-generator-file.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('writeGeneratorFile', () => {
  const outputDirectory = '/root';
  const generatedContentsDirectory = '/generated';

  it('should write a simple file', async () => {
    const fileOperation: GeneratorFileOperationResult = {
      relativePath: 'test.txt',
      previousRelativePath: 'test.txt',
      mergedContents: Buffer.from('hello world'),
      generatedContents: Buffer.from('hello world'),
    };

    await writeGeneratorFile({
      fileOperation,
      outputDirectory,
    });

    expect(vol.toJSON()).toEqual({
      '/root/test.txt': 'hello world',
    });
  });

  it('should write to both output and generated directories when specified', async () => {
    const fileOperation: GeneratorFileOperationResult = {
      relativePath: 'test.txt',
      previousRelativePath: 'test.txt',
      mergedContents: Buffer.from('merged content'),
      generatedContents: Buffer.from('generated content'),
    };

    await writeGeneratorFile({
      fileOperation,
      outputDirectory,
      generatedContentsDirectory,
    });

    expect(vol.toJSON()).toEqual({
      '/root/test.txt': 'merged content',
      '/generated/test.txt': 'generated content',
    });
  });

  it('should handle file renames', async () => {
    vol.fromJSON({
      '/root/old.txt': 'original content',
    });

    const fileOperation: GeneratorFileOperationResult = {
      relativePath: 'new.txt',
      previousRelativePath: 'old.txt',
      mergedContents: Buffer.from('updated content'),
      generatedContents: Buffer.from('updated content'),
    };

    await writeGeneratorFile({
      fileOperation,
      outputDirectory,
    });

    const files = vol.toJSON();
    expect(files['/root/old.txt']).toBeUndefined();
    expect(files['/root/new.txt']).toBe('updated content');
  });

  it('should write conflict files when specified', async () => {
    const fileOperation: GeneratorFileOperationResult = {
      relativePath: 'test.txt',
      previousRelativePath: 'test.txt',
      mergedContents: Buffer.from('merged content'),
      generatedContents: Buffer.from('generated content'),
      generatedConflictRelativePath: 'test.txt.conflict',
    };

    await writeGeneratorFile({
      fileOperation,
      outputDirectory,
    });

    expect(vol.toJSON()).toEqual({
      '/root/test.txt': 'merged content',
      '/root/test.txt.conflict': 'generated content',
    });
  });

  it('should throw error when rename target already exists', async () => {
    vol.fromJSON({
      '/root/old.txt': 'original content',
      '/root/new.txt': 'existing content',
    });

    const fileOperation: GeneratorFileOperationResult = {
      relativePath: 'new.txt',
      previousRelativePath: 'old.txt',
      mergedContents: Buffer.from('updated content'),
      generatedContents: Buffer.from('updated content'),
    };

    await expect(
      writeGeneratorFile({
        fileOperation,
        outputDirectory,
      }),
    ).rejects.toThrow(/Cannot rename.*as target path already exists/);

    // Verify files remain unchanged
    expect(vol.toJSON()).toEqual({
      '/root/old.txt': 'original content',
      '/root/new.txt': 'existing content',
    });
  });
});
