import type { TemplateFileExtractorFile } from '@halfdomelabs/sync';

import { describe, expect, it } from 'vitest';

import type { TsTemplateFileMetadata } from '../templates/types.js';

import { writeTsProjectExports } from './write-ts-project-exports.js';

const TEST_GENERATOR_NAME = 'package#test/test-generator';
const TEST_IMPORT_MAP_PATH = '/root/import-map.ts';

const EXPORT_METADATA_COMMON = {
  providerImportName: 'testGeneratorImportsProvider',
  providerPath: TEST_IMPORT_MAP_PATH,
  providerPackage: 'package',
  importSource: '%testGeneratorImports',
};

describe('writeTsProjectExports', () => {
  it('should handle empty project exports', () => {
    const files: TemplateFileExtractorFile<TsTemplateFileMetadata>[] = [
      {
        path: '/test/path/file1.ts',
        metadata: {
          type: 'ts',
          name: 'test1',
          generator: TEST_GENERATOR_NAME,
          template: 'test1.ts',
          variables: {},
        },
      },
    ];

    const result = writeTsProjectExports(
      files,
      '/test',
      TEST_GENERATOR_NAME,
      TEST_IMPORT_MAP_PATH,
    );

    expect(result.importsFileContents).toBeUndefined();
    expect(result.projectExports).toEqual([]);
  });

  it('should process project exports correctly', () => {
    const files: TemplateFileExtractorFile<TsTemplateFileMetadata>[] = [
      {
        path: '/test/path/file1.ts',
        metadata: {
          type: 'ts',
          name: 'test1',
          generator: TEST_GENERATOR_NAME,
          template: 'test1.ts',
          variables: {},
          projectExports: {
            TestExport: { isTypeOnly: false },
            TypeOnlyExport: { isTypeOnly: true },
          },
        },
      },
    ];

    const result = writeTsProjectExports(
      files,
      '/test',
      TEST_GENERATOR_NAME,
      TEST_IMPORT_MAP_PATH,
    );

    expect(result.projectExports).toEqual([
      {
        name: 'TestExport',
        isTypeOnly: false,
        filePath: '/test/path/file1.ts',
        ...EXPORT_METADATA_COMMON,
      },
      {
        name: 'TypeOnlyExport',
        isTypeOnly: true,
        filePath: '/test/path/file1.ts',
        ...EXPORT_METADATA_COMMON,
      },
    ]);

    expect(result.importsFileContents).toContain('TestExport: {}');
    expect(result.importsFileContents).toContain(
      'TypeOnlyExport: {"isTypeOnly":true}',
    );
    expect(result.importsFileContents).toContain('test-generator');
    expect(result.importsFileContents).toContain('createTestGeneratorImports');
  });

  it('should handle local imports for core-generators', () => {
    const files: TemplateFileExtractorFile<TsTemplateFileMetadata>[] = [
      {
        path: '/test/path/file1.ts',
        metadata: {
          type: 'ts',
          name: 'test1',
          generator: '@halfdomelabs/core-generators#test',
          template: 'test1.ts',
          variables: {},
          projectExports: {
            TestExport: { isTypeOnly: false },
          },
        },
      },
    ];

    const result = writeTsProjectExports(
      files,
      '/test',
      '@halfdomelabs/core-generators#test',
      TEST_IMPORT_MAP_PATH,
    );

    expect(result.importsFileContents).toContain(
      '@src/renderers/typescript/index.ts',
    );
    expect(result.importsFileContents).not.toContain(
      '@halfdomelabs/core-generators',
    );
  });

  it('should handle external imports for non-core-generators', () => {
    const files: TemplateFileExtractorFile<TsTemplateFileMetadata>[] = [
      {
        path: '/test/path/file1.ts',
        metadata: {
          type: 'ts',
          name: 'test1',
          generator: 'external-generator#test',
          template: 'test1.ts',
          variables: {},
          projectExports: {
            TestExport: { isTypeOnly: false },
          },
        },
      },
    ];

    const result = writeTsProjectExports(
      files,
      '/test',
      'external-generator#test',
      TEST_IMPORT_MAP_PATH,
    );

    expect(result.importsFileContents).toContain(
      '@halfdomelabs/core-generators',
    );
    expect(result.importsFileContents).not.toContain(
      '@src/renderers/typescript/index.ts',
    );
  });

  it('should throw error for duplicate exports', () => {
    const files: TemplateFileExtractorFile<TsTemplateFileMetadata>[] = [
      {
        path: '/test/path/file1.ts',
        metadata: {
          type: 'ts',
          name: 'test1',
          generator: TEST_GENERATOR_NAME,
          template: 'test1.ts',
          variables: {},
          projectExports: {
            TestExport: { isTypeOnly: false },
          },
        },
      },
      {
        path: '/test/path/file2.ts',
        metadata: {
          type: 'ts',
          name: 'test2',
          generator: TEST_GENERATOR_NAME,
          template: 'test2.ts',
          variables: {},
          projectExports: {
            TestExport: { isTypeOnly: true },
          },
        },
      },
    ];

    expect(() =>
      writeTsProjectExports(
        files,
        '/test',
        TEST_GENERATOR_NAME,
        TEST_IMPORT_MAP_PATH,
      ),
    ).toThrow(
      `Duplicate project exports found in template files for generator ${TEST_GENERATOR_NAME}: TestExport`,
    );
  });

  it('should generate correct path mappings', () => {
    const files: TemplateFileExtractorFile<TsTemplateFileMetadata>[] = [
      {
        path: '/test/path/file1.ts',
        metadata: {
          type: 'ts',
          name: 'test1',
          generator: TEST_GENERATOR_NAME,
          template: 'test1.ts',
          variables: {},
          projectExports: {
            TestExport: { isTypeOnly: false },
          },
        },
      },
    ];

    const result = writeTsProjectExports(
      files,
      '/test',
      TEST_GENERATOR_NAME,
      TEST_IMPORT_MAP_PATH,
    );

    expect(result.importsFileContents).toContain(
      "TestExport: path.join(baseDirectory, 'file1.ts')",
    );
  });
});
