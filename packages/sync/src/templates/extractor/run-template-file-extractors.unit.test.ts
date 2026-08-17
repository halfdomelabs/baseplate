import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestLogger } from '#src/tests/logger.test-utils.js';

import type { TemplateFileExtractor } from './runner/template-file-extractor.js';

import { runTemplateFileExtractors } from './run-template-file-extractors.js';
import { createTemplateFileExtractor } from './runner/template-file-extractor.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

const OUTPUT_DIRECTORY = '/output/apps/web';
const PACKAGE_PATH = '/packages/test-generators';
const GENERATOR_NAME = 'test-generators#core/routes';

function templateInfo(templateName: string): Record<string, unknown> {
  return {
    generator: GENERATOR_NAME,
    template: templateName,
    instanceData: {},
  };
}

beforeEach(() => {
  vol.reset();
  vol.fromJSON({
    [`${PACKAGE_PATH}/package.json`]: JSON.stringify({
      name: 'test-generators',
    }),
    [`${PACKAGE_PATH}/src/generators/core/routes/extractor.json`]:
      JSON.stringify({
        name: 'core/routes',
        templates: {
          about: { type: 'text', sourceFile: 'routes/about.tsx' },
          index: { type: 'text', sourceFile: 'routes/index.tsx' },
        },
      }),
    [`${OUTPUT_DIRECTORY}/src/routes/index.tsx`]: 'export const index = 1;\n',
    [`${OUTPUT_DIRECTORY}/src/routes/about.tsx`]: 'export const about = 1;\n',
    [`${OUTPUT_DIRECTORY}/src/routes/.templates-info.json`]: JSON.stringify({
      'index.tsx': templateInfo('index'),
      'about.tsx': templateInfo('about'),
    }),
  });
});

/**
 * Records which files each stage of the extractor was handed so the exclusion behaviour can
 * be asserted without depending on a real extractor implementation.
 */
function createRecordingExtractor(): {
  extractor: TemplateFileExtractor;
  extractedPaths: string[];
  allFilePaths: string[];
} {
  const extractedPaths: string[] = [];
  const allFilePaths: string[] = [];

  const extractor = createTemplateFileExtractor({
    name: 'text',
    extractTemplateMetadataEntries: (files) => {
      extractedPaths.push(...files.map((file) => file.absolutePath));
      return files.map((file) => ({
        generator: file.generatorName,
        sourceAbsolutePath: file.absolutePath,
        templateName: file.templateName,
        metadata: file.existingMetadata,
        instanceData: file.instanceData,
      }));
    },
    writeTemplateFiles: (_entries, _context, _api, allFiles) => {
      allFilePaths.push(...allFiles.map((file) => file.absolutePath));
    },
    writeGeneratedFiles: () => {
      // nothing to generate for this stub
    },
  });

  return { extractor, extractedPaths, allFilePaths };
}

describe('runTemplateFileExtractors', () => {
  it('should extract every template file when nothing is excluded', async () => {
    const { extractor, extractedPaths } = createRecordingExtractor();

    await runTemplateFileExtractors(
      [extractor],
      OUTPUT_DIRECTORY,
      new Map([['test-generators', PACKAGE_PATH]]),
      createTestLogger(),
      [OUTPUT_DIRECTORY],
      { skipClean: true },
    );

    expect(extractedPaths.toSorted()).toEqual([
      `${OUTPUT_DIRECTORY}/src/routes/about.tsx`,
      `${OUTPUT_DIRECTORY}/src/routes/index.tsx`,
    ]);
  });

  it('should skip excluded files while keeping them available to writeTemplateFiles', async () => {
    const { extractor, extractedPaths, allFilePaths } =
      createRecordingExtractor();

    await runTemplateFileExtractors(
      [extractor],
      OUTPUT_DIRECTORY,
      new Map([['test-generators', PACKAGE_PATH]]),
      createTestLogger(),
      [OUTPUT_DIRECTORY],
      {
        skipClean: true,
        excludedOutputRelativePaths: ['src/routes/index.tsx'],
      },
    );

    // the excluded file is never read back into a template...
    expect(extractedPaths).toEqual([
      `${OUTPUT_DIRECTORY}/src/routes/about.tsx`,
    ]);
    // ...but still contributes to the project export and template path maps
    expect(allFilePaths.toSorted()).toEqual([
      `${OUTPUT_DIRECTORY}/src/routes/about.tsx`,
      `${OUTPUT_DIRECTORY}/src/routes/index.tsx`,
    ]);
  });
});
