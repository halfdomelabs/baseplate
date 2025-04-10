import path from 'node:path';

import type { TemplateFileExtractorContext } from './template-file-extractor.js';

const DEFAULT_OUTPUT_DIRECTORY = '/root/output';
const TEST_GENERATOR_NAME = 'test-package#test-generator';
const TEST_GENERATOR_BASE_DIRECTORY = '/root/test-generator';
const TEST_GENERATOR_TEMPLATE_DIRECTORY = '/root/test-generator/templates';

function createTestTemplateFileExtractorContext(
  context?: Partial<TemplateFileExtractorContext>,
): TemplateFileExtractorContext {
  return {
    outputDirectory: DEFAULT_OUTPUT_DIRECTORY,
    generatorInfoMap: new Map([
      [
        TEST_GENERATOR_NAME,
        {
          name: TEST_GENERATOR_NAME,
          baseDirectory: TEST_GENERATOR_BASE_DIRECTORY,
        },
      ],
    ]),
    logger: console,
    ...context,
  };
}

export const TemplateFileExtractorTestUtils = {
  createTestTemplateFileExtractorContext,
  DEFAULT_OUTPUT_DIRECTORY,
  TEST_GENERATOR_NAME,
  TEST_GENERATOR_BASE_DIRECTORY,
  TEST_GENERATOR_TEMPLATE_DIRECTORY,
  generatedPath(template: string) {
    return path.join(
      TemplateFileExtractorTestUtils.TEST_GENERATOR_BASE_DIRECTORY,
      'generated',
      template,
    );
  },
  templatePath(template: string) {
    return path.join(
      TemplateFileExtractorTestUtils.TEST_GENERATOR_TEMPLATE_DIRECTORY,
      template,
    );
  },
};
