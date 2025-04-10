import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplateFileExtractorTestUtils } from '../extractor/template-file-extractor-test-utils.js';
import { TextTemplateFileExtractor } from './text-template-file-extractor.js';
import { TEXT_TEMPLATE_TYPE } from './types.js';

vi.mock('node:fs/promises');
vi.mock('node:fs');

beforeEach(() => {
  vol.reset();
});

describe('TextTemplateFileExtractor', () => {
  it('should extract text template files', async () => {
    const context =
      TemplateFileExtractorTestUtils.createTestTemplateFileExtractorContext();

    const extractor = new TextTemplateFileExtractor(context);

    vol.fromJSON({
      '/root/test-generator/test.txt': 'Hello world from my couch!',
    });

    await extractor.extractTemplateFiles([
      {
        path: '/root/test-generator/test.txt',
        metadata: {
          name: 'test',
          type: TEXT_TEMPLATE_TYPE,
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'test.txt',
          variables: {
            TPL_LOCATION: {
              description: 'The location of the test',
              value: 'my couch',
            },
          },
        },
      },
    ]);

    const result = vol.toJSON();

    expect(
      result[TemplateFileExtractorTestUtils.templatePath('test.txt')],
    ).toBe('Hello world from {{TPL_LOCATION}}!');
    expect(
      result[TemplateFileExtractorTestUtils.generatedPath('text-templates.ts')],
    ).toMatchInlineSnapshot(`
      "import { createTextTemplateFile } from "@halfdomelabs/sync";

      const TestTextTemplate = createTextTemplateFile({
        name: "test",
        source: { path: "test.txt" },
        variables: { TPL_LOCATION: { description: "The location of the test" } },
      });

      export const TEST_GENERATOR_TEXT_TEMPLATES = {
        TestTextTemplate,
      };
      "
    `);
  });
});
