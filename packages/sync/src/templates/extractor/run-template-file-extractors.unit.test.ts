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
            type: 'test-type',
            generator: 'test-generator',
            template: 'test-template.ts',
          },
          'test-file-2.ts': {
            type: 'test-type-2',
            generator: 'test-generator-2',
            template: 'test-template-2.ts',
          },
        }),
      [path.join(outputDirectory, 'src/folder', TEMPLATE_METADATA_FILENAME)]:
        JSON.stringify({
          'index.ts': {
            type: 'test-type',
            generator: 'test-generator',
            template: 'test-template.ts',
          },
        }),
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
    expect(context.outputDirectory).toBe(outputDirectory);
    expect(context.generatorInfoMap.get('test-pkg#test-generator')).toEqual({
      name: 'test-pkg#test-generator',
      baseDirectory: '/test/pkg/src/generators/test-generator',
    });

    expect(mockExtract).toHaveBeenCalledTimes(2);
    expect(mockExtract).toHaveBeenCalledWith('test-type', [
      {
        path: path.join(outputDirectory, 'src/test-file.ts'),
        metadata: {
          type: 'test-type',
          generator: 'test-generator',
          template: 'test-template.ts',
        },
      },
      {
        path: path.join(outputDirectory, 'src/folder/index.ts'),
        metadata: {
          type: 'test-type',
          generator: 'test-generator',
          template: 'test-template.ts',
        },
      },
    ]);
    expect(mockExtract).toHaveBeenCalledWith('test-type-2', [
      {
        path: path.join(outputDirectory, 'src/test-file-2.ts'),
        metadata: {
          type: 'test-type-2',
          generator: 'test-generator-2',
          template: 'test-template-2.ts',
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
            type: 'test-type-2',
            generator: 'test-generator-2',
            template: 'test-template-2.ts',
          },
        }),
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
