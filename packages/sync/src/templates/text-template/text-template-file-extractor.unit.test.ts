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
      "import { createTextTemplateFile } from '@halfdomelabs/sync';

      const test = createTextTemplateFile({
        name: 'test',
        source: { path: 'test.txt' },
        variables: { TPL_LOCATION: { description: 'The location of the test' } },
      });

      export const TEST_GENERATOR_TEXT_TEMPLATES = {
        test,
      };
      "
    `);
  });

  it('should extract text template files with groups', async () => {
    const context =
      TemplateFileExtractorTestUtils.createTestTemplateFileExtractorContext();

    const extractor = new TextTemplateFileExtractor(context);

    vol.fromJSON({
      '/root/test-generator/group1/file1.txt': 'Hello from file 1!',
      '/root/test-generator/group1/file2.txt': 'Hello from file 2!',
      '/root/test-generator/group2/file3.txt': 'Hello from file 3!',
    });

    await extractor.extractTemplateFiles([
      {
        path: '/root/test-generator/group1/file1.txt',
        metadata: {
          name: 'file1',
          type: TEXT_TEMPLATE_TYPE,
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'group1/file1.txt',
          group: 'group1',
          variables: {},
        },
      },
      {
        path: '/root/test-generator/group1/file2.txt',
        metadata: {
          name: 'file2',
          type: TEXT_TEMPLATE_TYPE,
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'group1/file2.txt',
          group: 'group1',
          variables: {},
        },
      },
      {
        path: '/root/test-generator/group2/file3.txt',
        metadata: {
          name: 'file3',
          type: TEXT_TEMPLATE_TYPE,
          generator: TemplateFileExtractorTestUtils.TEST_GENERATOR_NAME,
          template: 'group2/file3.txt',
          group: 'group2',
          variables: {},
        },
      },
    ]);

    const result = vol.toJSON();

    // Verify template files were created
    expect(
      result[TemplateFileExtractorTestUtils.templatePath('group1/file1.txt')],
    ).toBe('Hello from file 1!');
    expect(
      result[TemplateFileExtractorTestUtils.templatePath('group1/file2.txt')],
    ).toBe('Hello from file 2!');
    expect(
      result[TemplateFileExtractorTestUtils.templatePath('group2/file3.txt')],
    ).toBe('Hello from file 3!');

    // Verify generated typescript file contains groups
    expect(
      result[TemplateFileExtractorTestUtils.generatedPath('text-templates.ts')],
    ).toMatchInlineSnapshot(`
      "import {
        createTextTemplateFile,
        createTextTemplateGroup,
      } from '@halfdomelabs/sync';

      const file1 = createTextTemplateFile({
        name: 'file1',
        group: 'group1',
        source: { path: 'group1/file1.txt' },
        variables: {},
      });

      const file2 = createTextTemplateFile({
        name: 'file2',
        group: 'group1',
        source: { path: 'group1/file2.txt' },
        variables: {},
      });

      const group1Group = createTextTemplateGroup({
        templates: {
          file1: {
            destination: 'file1.txt',
            template: file1,
          },
          file2: {
            destination: 'file2.txt',
            template: file2,
          },
        },
      });

      const file3 = createTextTemplateFile({
        name: 'file3',
        group: 'group2',
        source: { path: 'group2/file3.txt' },
        variables: {},
      });

      const group2Group = createTextTemplateGroup({
        templates: {
          file3: {
            destination: 'file3.txt',
            template: file3,
          },
        },
      });

      export const TEST_GENERATOR_TEXT_TEMPLATES = {
        group1Group,
        group2Group,
      };
      "
    `);
  });
});
