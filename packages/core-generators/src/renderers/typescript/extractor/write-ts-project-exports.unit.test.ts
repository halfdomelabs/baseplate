import type { TemplateFileExtractorFile } from '@baseplate-dev/sync';

import { describe, expect, it } from 'vitest';

import type { TsTemplateOutputTemplateMetadata } from '../templates/types.js';

import { writeTsProjectExports } from './write-ts-project-exports.js';

const TEST_GENERATOR_NAME = 'package#test/test-generator';
const TEST_IMPORT_MAP_PATH = '/root/import-map.ts';
const TEST_GENERATOR_PACKAGE_PATH = '/root';
const EXPORT_METADATA_COMMON = {
  providerImportName: 'testGeneratorImportsProvider',
  providerPath: TEST_IMPORT_MAP_PATH,
  providerPackage: 'package',
  importSource: '%testGeneratorImports',
};

describe('writeTsProjectExports', () => {
  it('should handle empty project exports', () => {
    const files: TemplateFileExtractorFile<TsTemplateOutputTemplateMetadata>[] =
      [
        {
          path: '/test/path/file1.ts',
          metadata: {
            type: 'ts',
            name: 'test1',
            generator: TEST_GENERATOR_NAME,
            template: 'test1.ts',
            fileOptions: { kind: 'singleton' },
          },
        },
      ];

    const result = writeTsProjectExports(files, TEST_GENERATOR_NAME, {
      importMapFilePath: TEST_IMPORT_MAP_PATH,
      packagePath: TEST_GENERATOR_PACKAGE_PATH,
    });

    expect(result.importsFileFragment).toBeUndefined();
    expect(result.projectExports).toEqual([]);
  });

  it('should process project exports correctly', () => {
    const files: TemplateFileExtractorFile<TsTemplateOutputTemplateMetadata>[] =
      [
        {
          path: '/test/path/file1.ts',
          metadata: {
            type: 'ts',
            name: 'test1',
            generator: TEST_GENERATOR_NAME,
            template: 'test1.ts',
            projectExports: {
              TestExport: {},
              TypeOnlyExport: { isTypeOnly: true },
              TestDefaultExport: { exportName: 'default' },
            },
            fileOptions: { kind: 'singleton' },
          },
        },
      ];

    const result = writeTsProjectExports(files, TEST_GENERATOR_NAME, {
      importMapFilePath: TEST_IMPORT_MAP_PATH,
      packagePath: TEST_GENERATOR_PACKAGE_PATH,
    });

    expect(result.projectExports).toEqual([
      {
        name: 'TestDefaultExport',
        exportName: 'default',
        filePath: '/test/path/file1.ts',
        ...EXPORT_METADATA_COMMON,
      },
      {
        name: 'TestExport',
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
    expect(importsContents).toContain('TestDefaultExport: {"name":"default"}');
    expect(importsContents).toContain('test-generator');
    expect(importsContents).toContain('createTestGeneratorImports');
  });

  it('should handle local imports for core-generators', () => {
    const files: TemplateFileExtractorFile<TsTemplateOutputTemplateMetadata>[] =
      [
        {
          path: '/test/path/file1.ts',
          metadata: {
            type: 'ts',
            name: 'test1',
            generator: '@baseplate-dev/core-generators#test',
            template: 'test1.ts',
            projectExports: {
              TestExport: { isTypeOnly: false },
            },
            fileOptions: { kind: 'singleton' },
          },
        },
      ];

    const result = writeTsProjectExports(
      files,
      '@baseplate-dev/core-generators#test',
      {
        importMapFilePath: TEST_IMPORT_MAP_PATH,
        packagePath: TEST_GENERATOR_PACKAGE_PATH,
      },
    );

    const imports =
      result.importsFileFragment?.imports?.map((m) => m.moduleSpecifier) ?? [];
    expect(imports).toContain('@src/renderers/typescript/index.js');
    expect(imports).not.toContain('@baseplate-dev/core-generators');
  });

  it('should handle external imports for non-core-generators', () => {
    const files: TemplateFileExtractorFile<TsTemplateOutputTemplateMetadata>[] =
      [
        {
          path: '/test/path/file1.ts',
          metadata: {
            type: 'ts',
            name: 'test1',
            generator: 'external-generator#test',
            template: 'test1.ts',
            projectExports: {
              TestExport: { isTypeOnly: false },
            },
            fileOptions: { kind: 'singleton' },
          },
        },
      ];

    const result = writeTsProjectExports(files, 'external-generator#test', {
      importMapFilePath: TEST_IMPORT_MAP_PATH,
      packagePath: TEST_GENERATOR_PACKAGE_PATH,
    });

    const imports =
      result.importsFileFragment?.imports?.map((m) => m.moduleSpecifier) ?? [];
    expect(imports).toContain('@baseplate-dev/core-generators');
    expect(imports).not.toContain('@src/renderers/typescript/index.ts');
  });

  it('should use existing imports provider when specified', () => {
    const files: TemplateFileExtractorFile<TsTemplateOutputTemplateMetadata>[] =
      [
        {
          path: '/test/path/file1.ts',
          metadata: {
            type: 'ts',
            name: 'test1',
            generator: TEST_GENERATOR_NAME,
            template: 'test1.ts',
            projectExports: {
              TestExport: { isTypeOnly: false },
            },
            fileOptions: { kind: 'singleton' },
          },
        },
      ];

    const existingImportsProvider = {
      moduleSpecifier: '@/test/existing-imports',
      importSchemaName: 'existingImportsSchema',
      providerTypeName: 'ExistingImportsProvider',
      providerName: 'existingImportsProvider',
    };

    const result = writeTsProjectExports(files, TEST_GENERATOR_NAME, {
      importMapFilePath: TEST_IMPORT_MAP_PATH,
      packagePath: TEST_GENERATOR_PACKAGE_PATH,
      existingImportsProvider,
    });

    const imports = result.importsFileFragment?.imports;
    expect(imports).toContainEqual({
      moduleSpecifier: 'test/existing-imports',
      namedImports: [{ name: 'existingImportsSchema' }],
    });
    expect(imports).toContainEqual({
      moduleSpecifier: 'test/existing-imports',
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
    const files: TemplateFileExtractorFile<TsTemplateOutputTemplateMetadata>[] =
      [
        {
          path: '/test/path/file1.ts',
          metadata: {
            type: 'ts',
            name: 'test1',
            generator: TEST_GENERATOR_NAME,
            template: 'test1.ts',
            projectExports: {
              TestExport: { isTypeOnly: false },
            },
            fileOptions: { kind: 'singleton' },
          },
        },
        {
          path: '/test/path/file2.ts',
          metadata: {
            type: 'ts',
            name: 'test2',
            generator: TEST_GENERATOR_NAME,
            template: 'test2.ts',
            projectExports: {
              TestExport: { isTypeOnly: true },
            },
            fileOptions: { kind: 'singleton' },
          },
        },
      ];

    expect(() =>
      writeTsProjectExports(files, TEST_GENERATOR_NAME, {
        importMapFilePath: TEST_IMPORT_MAP_PATH,
        packagePath: TEST_GENERATOR_PACKAGE_PATH,
      }),
    ).toThrow(
      `Duplicate project exports found in template files for generator ${TEST_GENERATOR_NAME}: TestExport`,
    );
  });

  it('should generate correct path mappings', () => {
    const files: TemplateFileExtractorFile<TsTemplateOutputTemplateMetadata>[] =
      [
        {
          path: '/test/path/file1.ts',
          metadata: {
            type: 'ts',
            name: 'test1',
            generator: TEST_GENERATOR_NAME,
            template: 'test1.ts',
            projectExports: {
              TestExport: { isTypeOnly: false },
            },
            fileOptions: { kind: 'singleton' },
          },
        },
      ];

    const result = writeTsProjectExports(files, TEST_GENERATOR_NAME, {
      importMapFilePath: TEST_IMPORT_MAP_PATH,
      packagePath: TEST_GENERATOR_PACKAGE_PATH,
    });

    const importsContents = result.importsFileFragment?.contents;
    expect(importsContents).toContain(
      "TestExport: path.join(importBase, 'file1.js')",
    );
  });
});
