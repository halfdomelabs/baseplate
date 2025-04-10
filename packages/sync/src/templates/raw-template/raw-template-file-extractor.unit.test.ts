import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplateFileExtractorTestUtils } from '../extractor/template-file-extractor-test-utils.js';
import { RawTemplateFileExtractor } from './raw-template-file-extractor.js';
import { RAW_TEMPLATE_TYPE } from './types.js';

vi.mock('node:fs/promises');
vi.mock('node:fs');

beforeEach(() => {
  vol.reset();
});

describe('RawTemplateFileExtractor', () => {
  it('should extract raw template files', async () => {
    const context =
      TemplateFileExtractorTestUtils.createTestTemplateFileExtractorContext();

    const extractor = new RawTemplateFileExtractor(context);

    vol.fromJSON({
      '/root/test-generator/test.txt': 'Hello world from my couch!',
      '/root/test-generator/test2.txt': 'Another test!',
    });

    await extractor.extractTemplateFiles([
      {
        path: '/root/test-generator/test.txt',
        metadata: {
          type: RAW_TEMPLATE_TYPE,
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'test.txt',
        },
      },
      {
        path: '/root/test-generator/test2.txt',
        metadata: {
          type: RAW_TEMPLATE_TYPE,
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'test2.txt',
        },
      },
    ]);

    const result = vol.toJSON();

    expect(
      result[TemplateFileExtractorTestUtils.templatePath('test.txt')],
    ).toBe('Hello world from my couch!');

    expect(
      result[TemplateFileExtractorTestUtils.templatePath('test2.txt')],
    ).toBe('Another test!');
  });
});
