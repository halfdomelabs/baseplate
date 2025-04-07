import { describe, expect, it } from 'vitest';

import type { TsImportDeclaration } from '../imports/types.js';
import type { TsImportMap } from './types.js';

import { transformTsImportsWithMap } from './transform-ts-imports-with-map.js';
import { createTsImportMap, createTsImportMapSchema } from './ts-import-map.js';

describe('transformImportsWithMap', () => {
  it('should return unchanged imports when no $ prefix is present', () => {
    const imports: TsImportDeclaration[] = [
      {
        source: 'react',
        namedImports: [{ name: 'useState' }],
      },
    ];

    const result = transformTsImportsWithMap(imports, new Map());
    expect(result).toEqual(imports);
  });

  it('should throw error when import map is not found', () => {
    const imports: TsImportDeclaration[] = [
      {
        source: '$unknown',
        namedImports: [{ name: 'test' }],
      },
    ];

    expect(() => transformTsImportsWithMap(imports, new Map())).toThrow(
      'Import map not found for $unknown',
    );
  });

  describe('for a test import map', () => {
    const testSchema = createTsImportMapSchema({
      test: { name: 'test' },
    });

    const testImportMaps = new Map<string, TsImportMap>([
      [
        'test',
        createTsImportMap(testSchema, { test: 'test-package' }) as TsImportMap,
      ],
    ]);

    it('should throw error for namespace imports', () => {
      const imports: TsImportDeclaration[] = [
        {
          source: '$test',
          namespaceImport: 'test',
        },
      ];

      expect(() => transformTsImportsWithMap(imports, testImportMaps)).toThrow(
        'Import map does not support namespace or default imports: $test',
      );
    });

    it('should throw error for default imports', () => {
      const imports: TsImportDeclaration[] = [
        {
          source: '$test',
          defaultImport: 'test',
        },
      ];

      expect(() => transformTsImportsWithMap(imports, testImportMaps)).toThrow(
        'Import map does not support namespace or default imports: $test',
      );
    });

    it('should throw error when import map entry is not found', () => {
      const imports: TsImportDeclaration[] = [
        {
          source: '$test',
          namedImports: [{ name: 'unknown' }],
        },
      ];

      expect(() => transformTsImportsWithMap(imports, testImportMaps)).toThrow(
        'Import map entry not found for unknown',
      );
    });

    it('should transform named imports using import map', () => {
      const imports: TsImportDeclaration[] = [
        {
          source: '$test',
          namedImports: [{ name: 'test' }],
        },
      ];

      const result = transformTsImportsWithMap(imports, testImportMaps);
      expect(result).toEqual([
        {
          source: 'test-package',
          namedImports: [{ name: 'test' }],
        },
      ]);
    });

    it('should handle type-only imports correctly', () => {
      const imports: TsImportDeclaration[] = [
        {
          source: '$test',
          namedImports: [{ name: 'test' }],
          isTypeOnly: true,
        },
      ];

      const result = transformTsImportsWithMap(imports, testImportMaps);
      expect(result).toEqual([
        {
          source: 'test-package',
          namedImports: [{ name: 'test' }],
          isTypeOnly: true,
        },
      ]);
    });
  });

  it('should handle multiple named imports', () => {
    const imports: TsImportDeclaration[] = [
      {
        source: '$test',
        namedImports: [{ name: 'test1' }, { name: 'test2' }],
      },
    ];

    const schema = createTsImportMapSchema({
      test1: { name: 'test1' },
      test2: { name: 'test2' },
    });

    const importMaps = new Map([
      [
        'test',
        createTsImportMap(schema, {
          test1: 'test-package1',
          test2: 'test-package2',
        }) as TsImportMap,
      ],
    ]);

    const result = transformTsImportsWithMap(imports, importMaps);
    expect(result).toEqual([
      {
        source: 'test-package1',
        namedImports: [{ name: 'test1' }],
      },
      {
        source: 'test-package2',
        namedImports: [{ name: 'test2' }],
      },
    ]);
  });
});
