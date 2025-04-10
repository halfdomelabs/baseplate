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
          name: 'test',
        },
      },
      {
        path: '/root/test-generator/test2.txt',
        metadata: {
          type: RAW_TEMPLATE_TYPE,
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'test2.txt',
          name: 'test2',
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

    expect(
      result[TemplateFileExtractorTestUtils.generatedPath('raw-templates.ts')],
    ).toMatchInlineSnapshot(`
      "import { createRawTemplateFile } from "@halfdomelabs/sync";

      const TestRawTemplate = createRawTemplateFile({
        name: "Test",
        source: { path: "test.txt" },
      });

      const Test2RawTemplate = createRawTemplateFile({
        name: "Test2",
        source: { path: "test2.txt" },
      });

      export const TEST_GENERATOR_RAW_TEMPLATES = {
        TestRawTemplate,
        Test2RawTemplate,
      };
      "
    `);
  });
});
