import { describe, expect, it } from 'vitest';

import type { TsImportDeclaration } from '../imports/types.js';
import type { TsImportMap } from './types.js';

import { transformTsImportsWithMap } from './transform-ts-imports-with-map.js';
import { createTsImportMap, createTsImportMapSchema } from './ts-import-map.js';

describe('transformImportsWithMap', () => {
  const generatorPaths: Record<string, string> = {};

  it('should return unchanged imports when no $ prefix is present', () => {
    const imports: TsImportDeclaration[] = [
      {
        moduleSpecifier: 'react',
        namedImports: [{ name: 'useState' }],
      },
    ];

    const result = transformTsImportsWithMap(
      imports,
      new Map(),
      generatorPaths,
    );
    expect(result).toEqual(imports);
  });

  it('should throw error when import map is not found', () => {
    const imports: TsImportDeclaration[] = [
      {
        moduleSpecifier: '%unknown',
        namedImports: [{ name: 'test' }],
      },
    ];

    expect(() =>
      transformTsImportsWithMap(imports, new Map(), generatorPaths),
    ).toThrow('Import map not found for %unknown');
  });

  describe('for a test import map', () => {
    const testSchema = createTsImportMapSchema({
      test: { exportedAs: 'test' },
      test2: { exportedAs: 'test2' },
    });

    const wildcardSchema = createTsImportMapSchema({
      '*': { exportedAs: 'wildcard' },
    });

    const testImportMaps = new Map<string, TsImportMap>([
      [
        'test',
        createTsImportMap(testSchema, {
          test: 'test-package',
          test2: 'test-package2',
        }) as TsImportMap,
      ],
      [
        'wildcard',
        createTsImportMap(wildcardSchema, {
          '*': 'test-package',
        }) as TsImportMap,
      ],
    ]);

    it('should throw error for namespace imports', () => {
      const imports: TsImportDeclaration[] = [
        {
          moduleSpecifier: '%test',
          namespaceImport: 'test',
        },
      ];

      expect(() =>
        transformTsImportsWithMap(imports, testImportMaps, generatorPaths),
      ).toThrow(
        'Import map does not support namespace or default imports: %test',
      );
    });

    it('should throw error for default imports', () => {
      const imports: TsImportDeclaration[] = [
        {
          moduleSpecifier: '%test',
          defaultImport: 'test',
        },
      ];

      expect(() =>
        transformTsImportsWithMap(imports, testImportMaps, generatorPaths),
      ).toThrow(
        'Import map does not support namespace or default imports: %test',
      );
    });

    it('should throw error when import map entry is not found', () => {
      const imports: TsImportDeclaration[] = [
        {
          moduleSpecifier: '%test',
          namedImports: [{ name: 'unknown' }],
        },
      ];

      expect(() =>
        transformTsImportsWithMap(imports, testImportMaps, generatorPaths),
      ).toThrow('Import map entry not found for unknown');
    });

    it('should transform named imports using import map', () => {
      const imports: TsImportDeclaration[] = [
        {
          moduleSpecifier: '%test',
          namedImports: [{ name: 'test' }],
        },
      ];

      const result = transformTsImportsWithMap(
        imports,
        testImportMaps,
        generatorPaths,
      );
      expect(result).toEqual([
        {
          moduleSpecifier: 'test-package',
          namedImports: [{ name: 'test' }],
        },
      ]);
    });

    it('should handle wildcard imports correctly', () => {
      const imports: TsImportDeclaration[] = [
        {
          moduleSpecifier: '%wildcard',
          namedImports: [{ name: 'someObject' }],
        },
        {
          moduleSpecifier: '%wildcard',
          namedImports: [{ name: 'SomeType' }],
          isTypeOnly: true,
        },
      ];

      const result = transformTsImportsWithMap(
        imports,
        testImportMaps,
        generatorPaths,
      );
      expect(result).toEqual([
        {
          moduleSpecifier: 'test-package',
          namedImports: [{ name: 'someObject' }],
        },
        {
          moduleSpecifier: 'test-package',
          namedImports: [{ name: 'SomeType' }],
          isTypeOnly: true,
        },
      ]);
    });

    it('should handle type-only imports correctly', () => {
      const imports: TsImportDeclaration[] = [
        {
          moduleSpecifier: '%test',
          namedImports: [{ name: 'test' }],
          isTypeOnly: true,
        },
        {
          moduleSpecifier: '%test',
          namedImports: [{ name: 'test2', isTypeOnly: true }],
        },
      ];

      const result = transformTsImportsWithMap(
        imports,
        testImportMaps,
        generatorPaths,
      );
      expect(result).toEqual([
        {
          moduleSpecifier: 'test-package',
          namedImports: [{ name: 'test' }],
          isTypeOnly: true,
        },
        {
          moduleSpecifier: 'test-package2',
          namedImports: [{ name: 'test2' }],
          isTypeOnly: true,
        },
      ]);
    });
  });

  it('should handle multiple named imports', () => {
    const imports: TsImportDeclaration[] = [
      {
        moduleSpecifier: '%test',
        namedImports: [{ name: 'test1' }, { name: 'test2' }],
      },
    ];

    const schema = createTsImportMapSchema({
      test1: { exportedAs: 'test1' },
      test2: { exportedAs: 'test2' },
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

    const result = transformTsImportsWithMap(
      imports,
      importMaps,
      generatorPaths,
    );
    expect(result).toEqual([
      {
        moduleSpecifier: 'test-package1',
        namedImports: [{ name: 'test1' }],
      },
      {
        moduleSpecifier: 'test-package2',
        namedImports: [{ name: 'test2' }],
      },
    ]);
  });

  describe('generator paths', () => {
    const testGeneratorPaths: Record<string, string> = {
      react: '@src/components/react',
      utils: '@src/utils',
    };

    it('should transform generator path imports correctly', () => {
      const imports: TsImportDeclaration[] = [
        {
          moduleSpecifier: '$react',
          namedImports: [{ name: 'Component' }],
        },
        {
          moduleSpecifier: '$utils',
          namedImports: [{ name: 'formatDate' }],
        },
      ];

      const result = transformTsImportsWithMap(
        imports,
        new Map(),
        testGeneratorPaths,
      );
      expect(result).toEqual([
        {
          moduleSpecifier: '@src/components/react',
          namedImports: [{ name: 'Component' }],
        },
        {
          moduleSpecifier: '@src/utils',
          namedImports: [{ name: 'formatDate' }],
        },
      ]);
    });

    it('should throw error when generator path is not found', () => {
      const imports: TsImportDeclaration[] = [
        {
          moduleSpecifier: '$unknown',
          namedImports: [{ name: 'test' }],
        },
      ];

      expect(() =>
        transformTsImportsWithMap(imports, new Map(), testGeneratorPaths),
      ).toThrow('Generator path not found for $unknown');
    });

    it('should preserve other properties when transforming generator paths', () => {
      const imports: TsImportDeclaration[] = [
        {
          moduleSpecifier: '$react',
          namedImports: [{ name: 'Component', isTypeOnly: true }],
          isTypeOnly: true,
        },
      ];

      const result = transformTsImportsWithMap(
        imports,
        new Map(),
        testGeneratorPaths,
      );
      expect(result).toEqual([
        {
          moduleSpecifier: '@src/components/react',
          namedImports: [{ name: 'Component', isTypeOnly: true }],
          isTypeOnly: true,
        },
      ]);
    });
  });
});
