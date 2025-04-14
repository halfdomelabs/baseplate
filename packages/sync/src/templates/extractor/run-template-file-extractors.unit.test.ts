import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestLogger } from '@src/tests/logger.test-helper.js';

import type {
  TemplateFileExtractorContext,
  TemplateFileExtractorCreator,
  TemplateFileExtractorFile,
} from './template-file-extractor.js';

import {
  GENERATOR_INFO_FILENAME,
  TEMPLATE_METADATA_FILENAME,
} from '../constants.js';
import { templateFileMetadataBaseSchema } from '../metadata/metadata.js';
import { runTemplateFileExtractors } from './run-template-file-extractors.js';
import { TemplateFileExtractor } from './template-file-extractor.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('runTemplateFileExtractors', () => {
  const outputDirectory = '/test/output';
  const generatorPackageMap = new Map([['test-pkg', '/test/pkg']]);
  const mockLogger = createTestLogger();

  const mockConstructor =
    vi.fn<(context: TemplateFileExtractorContext) => void>();
  const mockExtract = vi.fn();
  class MockExtractor extends TemplateFileExtractor {
    public metadataSchema = templateFileMetadataBaseSchema;

    constructor(
      context: TemplateFileExtractorContext,
      public name: string,
    ) {
      super(context);
      mockConstructor(context);
    }

    async extractTemplateFiles(
      files: TemplateFileExtractorFile[],
    ): Promise<void> {
      await mockExtract(this.name, files);
    }
  }

  beforeEach(() => {
    mockExtract.mockClear();
    vol.reset();
    vi.clearAllMocks();
  });

  it('should process template files with matching extractors', async () => {
    // mock file system
    vol.fromJSON({
      [path.join(outputDirectory, GENERATOR_INFO_FILENAME)]: JSON.stringify({
        'test-pkg#test-generator': 'src/generators/test-generator',
        'test-pkg#test-generator-2': 'src/generators/test-generator-2',
      }),
      [path.join(outputDirectory, 'src', TEMPLATE_METADATA_FILENAME)]:
        JSON.stringify({
          'test-file.ts': {
            name: 'test-file',
            type: 'test-type',
            generator: 'test-generator',
            template: 'test-template.ts',
          },
          'test-file-2.ts': {
            name: 'test-file-2',
            type: 'test-type-2',
            generator: 'test-generator-2',
            template: 'test-template-2.ts',
          },
        }),
      [path.join(outputDirectory, 'src', 'test-file.ts')]: 'test-file-content',
      [path.join(outputDirectory, 'src', 'test-file-2.ts')]:
        'test-file-2-content',
      [path.join(outputDirectory, 'src/folder', TEMPLATE_METADATA_FILENAME)]:
        JSON.stringify({
          'index.ts': {
            name: 'index-file',
            type: 'test-type',
            generator: 'test-generator',
            template: 'index-template.ts',
          },
        }),
      [path.join(outputDirectory, 'src/folder', 'index.ts')]:
        'index-file-content',
    });

    // Mock extractors
    const extractorCreators: TemplateFileExtractorCreator[] = [
      (context) => new MockExtractor(context, 'test-type'),
      (context) => new MockExtractor(context, 'test-type-2'),
    ];

    await runTemplateFileExtractors(
      extractorCreators,
      outputDirectory,
      generatorPackageMap,
      mockLogger,
    );

    // check context is correct
    const context = mockConstructor.mock.calls[0][0];
    expect(context.generatorInfoMap.get('test-pkg#test-generator')).toEqual({
      name: 'test-pkg#test-generator',
      baseDirectory: '/test/pkg/src/generators/test-generator',
    });

    expect(mockExtract).toHaveBeenCalledTimes(2);
    expect(mockExtract).toHaveBeenCalledWith(
      'test-type',
      expect.arrayContaining([
        {
          path: path.join(outputDirectory, 'src/test-file.ts'),
          metadata: {
            name: 'test-file',
            type: 'test-type',
            generator: 'test-generator',
            template: 'test-template.ts',
          },
        },
        {
          path: path.join(outputDirectory, 'src/folder/index.ts'),
          metadata: {
            name: 'index-file',
            type: 'test-type',
            generator: 'test-generator',
            template: 'index-template.ts',
          },
        },
      ]),
    );
    expect(mockExtract).toHaveBeenCalledWith('test-type-2', [
      {
        path: path.join(outputDirectory, 'src/test-file-2.ts'),
        metadata: {
          name: 'test-file-2',
          type: 'test-type-2',
          generator: 'test-generator-2',
          template: 'test-template-2.ts',
        },
      },
    ]);
  });

  it('should use the latest modified template when duplicates exist', async () => {
    const now = new Date();
    const olderTime = new Date(now.getTime() - 1000);
    const newerTime = new Date(now.getTime() + 1000);

    // mock file system with duplicate templates in different directories
    vol.fromJSON({
      [path.join(outputDirectory, GENERATOR_INFO_FILENAME)]: JSON.stringify({
        'test-pkg#test-generator': 'src/generators/test-generator',
      }),
      [path.join(outputDirectory, 'src', TEMPLATE_METADATA_FILENAME)]:
        JSON.stringify({
          'test-file.ts': {
            name: 'test-file',
            type: 'test-type',
            generator: 'test-generator',
            template: 'test-template.ts',
          },
        }),
      [path.join(outputDirectory, 'src', 'test-file.ts')]: 'test-file-content',
      [path.join(outputDirectory, GENERATOR_INFO_FILENAME)]: JSON.stringify({
        'test-pkg#test-generator': 'src/generators/test-generator',
      }),
      [path.join(outputDirectory, 'src/folder', TEMPLATE_METADATA_FILENAME)]:
        JSON.stringify({
          'test-file.ts': {
            name: 'test-file',
            type: 'test-type',
            generator: 'test-generator',
            template: 'test-template.ts',
          },
        }),
      [path.join(outputDirectory, 'src/folder', 'test-file.ts')]:
        'test-file-content-2',
    });

    // Mock file stats to simulate different modification times
    vol.utimesSync(
      path.join(outputDirectory, 'src/test-file.ts'),
      olderTime,
      olderTime,
    );
    vol.utimesSync(
      path.join(outputDirectory, 'src/folder/test-file.ts'),
      newerTime,
      newerTime,
    );

    // Mock extractors
    const extractorCreators: TemplateFileExtractorCreator[] = [
      (context) => new MockExtractor(context, 'test-type'),
    ];

    await runTemplateFileExtractors(
      extractorCreators,
      outputDirectory,
      generatorPackageMap,
      mockLogger,
    );

    expect(mockExtract).toHaveBeenCalledTimes(1);
    expect(mockExtract).toHaveBeenCalledWith('test-type', [
      {
        path: path.join(outputDirectory, 'src/folder/test-file.ts'),
        metadata: {
          name: 'test-file',
          type: 'test-type',
          generator: 'test-generator',
          template: 'test-template.ts',
        },
      },
    ]);
  });

  it('should throw error when no extractor found for file type', async () => {
    const extractorCreators: TemplateFileExtractorCreator[] = [
      (context) => new MockExtractor(context, 'test-extractor'),
    ];

    // Setup test files
    vol.fromJSON({
      [path.join(outputDirectory, GENERATOR_INFO_FILENAME)]: JSON.stringify({
        'test-pkg#test-generator': 'src/generators/test-generator',
      }),
      [path.join(outputDirectory, 'src', TEMPLATE_METADATA_FILENAME)]:
        JSON.stringify({
          'test-file-2.ts': {
            name: 'test-file-2',
            type: 'test-type-2',
            generator: 'test-generator-2',
            template: 'test-template-2.ts',
          },
        }),
      [path.join(outputDirectory, 'src', 'test-file-2.ts')]:
        'test-file-2-content',
    });

    await expect(
      runTemplateFileExtractors(
        extractorCreators,
        outputDirectory,
        generatorPackageMap,
        mockLogger,
      ),
    ).rejects.toThrow('No extractor found for template type: test-type-2');
  });
});
