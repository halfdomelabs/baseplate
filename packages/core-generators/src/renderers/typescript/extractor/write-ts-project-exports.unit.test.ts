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
      TEST_GENERATOR_NAME,
      TEST_IMPORT_MAP_PATH,
    );

    expect(result.importsFileFragment).toBeUndefined();
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

    const importsContents = result.importsFileFragment?.contents;
    expect(importsContents).toContain('TestExport: {}');
    expect(importsContents).toContain('TypeOnlyExport: {"isTypeOnly":true}');
    expect(importsContents).toContain('test-generator');
    expect(importsContents).toContain('createTestGeneratorImports');
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
      '@halfdomelabs/core-generators#test',
      TEST_IMPORT_MAP_PATH,
    );

    const imports =
      result.importsFileFragment?.imports?.map((m) => m.source) ?? [];
    expect(imports).toContain('@src/renderers/typescript/index.js');
    expect(imports).not.toContain('@halfdomelabs/core-generators');
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
      'external-generator#test',
      TEST_IMPORT_MAP_PATH,
    );

    const imports =
      result.importsFileFragment?.imports?.map((m) => m.source) ?? [];
    expect(imports).toContain('@halfdomelabs/core-generators');
    expect(imports).not.toContain('@src/renderers/typescript/index.ts');
  });

  it('should use existing imports provider when specified', () => {
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

    const existingImportsProvider = {
      moduleSpecifier: '@test/existing-imports',
      importSchemaName: 'existingImportsSchema',
      providerTypeName: 'ExistingImportsProvider',
      providerName: 'existingImportsProvider',
    };

    const result = writeTsProjectExports(
      files,
      TEST_GENERATOR_NAME,
      TEST_IMPORT_MAP_PATH,
      { existingImportsProvider },
    );

    const imports = result.importsFileFragment?.imports;
    expect(imports).toContainEqual({
      source: '@test/existing-imports',
      namedImports: [{ name: 'existingImportsSchema' }],
    });
    expect(imports).toContainEqual({
      source: '@test/existing-imports',
      namedImports: [{ name: 'ExistingImportsProvider' }],
      isTypeOnly: true,
    });
    const importsContents = result.importsFileFragment?.contents;
    expect(importsContents).toContain(
      'return createTsImportMap(existingImportsSchema',
    );
    expect(importsContents).toContain('): ExistingImportsProvider');
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
      writeTsProjectExports(files, TEST_GENERATOR_NAME, TEST_IMPORT_MAP_PATH),
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
      TEST_GENERATOR_NAME,
      TEST_IMPORT_MAP_PATH,
    );

    const importsContents = result.importsFileFragment?.contents;
    expect(importsContents).toContain(
      "TestExport: path.join(importBase, 'file1.js')",
    );
  });
});
