import { describe, expect, it } from 'vitest';

import type { TemplateMetadataFileEntry } from '../../metadata/read-template-metadata-files.js';

import { groupTemplateFilesByType } from './group-template-files-by-type.js';

describe('groupTemplateFilesByType', () => {
  const createMockEntry = (
    overrides: Partial<TemplateMetadataFileEntry> = {},
  ): TemplateMetadataFileEntry => ({
    absolutePath: '/project/test.ts',
    metadata: {
      name: 'test-template',
      type: 'ts',
      generator: '@test/package#generator',
      template: 'templates/test.ts',
    },
    modifiedTime: new Date('2024-01-01'),
    ...overrides,
  });

  it('should group files by type', () => {
    const files: TemplateMetadataFileEntry[] = [
      createMockEntry({
        metadata: {
          name: 'ts-file-1',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'file1.ts',
        },
      }),
      createMockEntry({
        metadata: {
          name: 'text-file-1',
          type: 'text',
          generator: '@test/package#generator',
          template: 'file1.txt',
        },
      }),
      createMockEntry({
        metadata: {
          name: 'ts-file-2',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'file2.ts',
        },
      }),
    ];

    const result = groupTemplateFilesByType(files);

    expect(Object.keys(result)).toHaveLength(2);
    expect(result.ts).toHaveLength(2);
    expect(result.text).toHaveLength(1);
  });

  it('should sort files by modification time (newest first)', () => {
    const oldDate = new Date('2024-01-01');
    const newDate = new Date('2024-01-02');

    const files: TemplateMetadataFileEntry[] = [
      createMockEntry({
        absolutePath: '/project/old.ts',
        modifiedTime: oldDate,
        metadata: {
          name: 'old-file',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'old.ts',
        },
      }),
      createMockEntry({
        absolutePath: '/project/new.ts',
        modifiedTime: newDate,
        metadata: {
          name: 'new-file',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'new.ts',
        },
      }),
    ];

    const result = groupTemplateFilesByType(files);

    expect(result.ts[0].metadata.name).toBe('new-file');
    expect(result.ts[1].metadata.name).toBe('old-file');
  });

  it('should keep only the latest file for same generator/template combo', () => {
    const oldDate = new Date('2024-01-01');
    const newDate = new Date('2024-01-02');

    const files: TemplateMetadataFileEntry[] = [
      createMockEntry({
        absolutePath: '/project/v1/test.ts',
        modifiedTime: oldDate,
        metadata: {
          name: 'test-template',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'templates/test.ts',
        },
      }),
      createMockEntry({
        absolutePath: '/project/v2/test.ts',
        modifiedTime: newDate,
        metadata: {
          name: 'test-template',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'templates/test.ts',
        },
      }),
    ];

    const result = groupTemplateFilesByType(files);

    expect(result.ts).toHaveLength(1);
    expect(result.ts[0].absolutePath).toBe('/project/v2/test.ts');
  });

  it('should throw error for duplicate names within the same generator', () => {
    const files: TemplateMetadataFileEntry[] = [
      createMockEntry({
        absolutePath: '/project/file1.ts',
        metadata: {
          name: 'duplicate-name',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'templates/file1.ts',
        },
      }),
      createMockEntry({
        absolutePath: '/project/file2.ts',
        metadata: {
          name: 'duplicate-name',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'templates/file2.ts',
        },
      }),
    ];

    expect(() => {
      groupTemplateFilesByType(files);
    }).toThrow(/Duplicate template names found/);

    expect(() => {
      groupTemplateFilesByType(files);
    }).toThrow(/duplicate-name/);

    expect(() => {
      groupTemplateFilesByType(files);
    }).toThrow(/@test\/package#generator/);
  });

  it('should allow same name in different generators', () => {
    const files: TemplateMetadataFileEntry[] = [
      createMockEntry({
        metadata: {
          name: 'same-name',
          type: 'ts',
          generator: '@test/package1#generator',
          template: 'templates/file.ts',
        },
      }),
      createMockEntry({
        metadata: {
          name: 'same-name',
          type: 'ts',
          generator: '@test/package2#generator',
          template: 'templates/file.ts',
        },
      }),
    ];

    const result = groupTemplateFilesByType(files);

    expect(result.ts).toHaveLength(2);
  });

  it('should handle empty input', () => {
    const result = groupTemplateFilesByType([]);

    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should throw error for multiple duplicate names across different types', () => {
    const files: TemplateMetadataFileEntry[] = [
      createMockEntry({
        absolutePath: '/project/dup1.ts',
        metadata: {
          name: 'dup-ts',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'dup1.ts',
        },
      }),
      createMockEntry({
        absolutePath: '/project/dup2.ts',
        metadata: {
          name: 'dup-ts',
          type: 'ts',
          generator: '@test/package#generator',
          template: 'dup2.ts',
        },
      }),
      createMockEntry({
        absolutePath: '/project/dup1.txt',
        metadata: {
          name: 'dup-text',
          type: 'text',
          generator: '@test/package#generator',
          template: 'dup1.txt',
        },
      }),
      createMockEntry({
        absolutePath: '/project/dup2.txt',
        metadata: {
          name: 'dup-text',
          type: 'text',
          generator: '@test/package#generator',
          template: 'dup2.txt',
        },
      }),
    ];

    expect(() => {
      groupTemplateFilesByType(files);
    }).toThrow(/Duplicate template names found/);

    // Check that error includes both duplicate names
    expect(() => {
      groupTemplateFilesByType(files);
    }).toThrow(/dup-ts/);

    expect(() => {
      groupTemplateFilesByType(files);
    }).toThrow(/dup-text/);
  });
});
