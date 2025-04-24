import path from 'node:path';

import type { TemplateFileExtractorContext } from './template-file-extractor.js';

const DEFAULT_OUTPUT_DIRECTORY = '/root/output';
const TEST_GENERATOR_NAME = 'test-package#test-generator';
const TEST_GENERATOR_PACKAGE_PATH = '/root';
const TEST_GENERATOR_BASE_DIRECTORY = '/root/test-generator';
const TEST_GENERATOR_TEMPLATE_DIRECTORY = '/root/test-generator/templates';

const TEST_GENERATOR_2_NAME = 'test-package#test-generator-2';
const TEST_GENERATOR_2_BASE_DIRECTORY = '/root/test-generator-2';
const TEST_GENERATOR_2_TEMPLATE_DIRECTORY = '/root/test-generator-2/templates';

function createTestTemplateFileExtractorContext(
  context?: Partial<TemplateFileExtractorContext>,
): TemplateFileExtractorContext {
  return {
    generatorInfoMap: new Map([
      [
        TEST_GENERATOR_NAME,
        {
          name: TEST_GENERATOR_NAME,
          baseDirectory: TEST_GENERATOR_BASE_DIRECTORY,
          packagePath: TEST_GENERATOR_PACKAGE_PATH,
        },
      ],
      [
        TEST_GENERATOR_2_NAME,
        {
          name: TEST_GENERATOR_2_NAME,
          baseDirectory: TEST_GENERATOR_2_BASE_DIRECTORY,
          packagePath: TEST_GENERATOR_PACKAGE_PATH,
        },
      ],
    ]),
    logger: console,
    baseDirectory: DEFAULT_OUTPUT_DIRECTORY,
    ...context,
  };
}

export const TemplateFileExtractorTestUtils = {
  createTestTemplateFileExtractorContext,
  DEFAULT_OUTPUT_DIRECTORY,
  TEST_GENERATOR_NAME,
  TEST_GENERATOR_BASE_DIRECTORY,
  TEST_GENERATOR_TEMPLATE_DIRECTORY,
  TEST_GENERATOR_2_NAME,
  TEST_GENERATOR_2_BASE_DIRECTORY,
  TEST_GENERATOR_2_TEMPLATE_DIRECTORY,
  generatedPath(template: string, generatorName?: string) {
    if (generatorName === TEST_GENERATOR_2_NAME) {
      return path.join(
        TemplateFileExtractorTestUtils.TEST_GENERATOR_2_BASE_DIRECTORY,
        'generated',
        template,
      );
    }
    return path.join(
      TemplateFileExtractorTestUtils.TEST_GENERATOR_BASE_DIRECTORY,
      'generated',
      template,
    );
  },
  templatePath(template: string, generatorName?: string) {
    if (generatorName === TEST_GENERATOR_2_NAME) {
      return path.join(
        TemplateFileExtractorTestUtils.TEST_GENERATOR_2_TEMPLATE_DIRECTORY,
        template,
      );
    }
    return path.join(
      TemplateFileExtractorTestUtils.TEST_GENERATOR_TEMPLATE_DIRECTORY,
      template,
    );
  },
  outputPath(template: string) {
    return path.join(
      TemplateFileExtractorTestUtils.DEFAULT_OUTPUT_DIRECTORY,
      template,
    );
  },
};
