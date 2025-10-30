import { createTestTsImportMap } from '@baseplate-dev/core-generators/test-helpers';
import { describe, expect, it } from 'vitest';

import { prismaGeneratedImportsSchema } from '../../_providers/prisma-generated-imports.js';
import { dataUtilsImportsSchema } from '../../data-utils/generated/ts-import-providers.js';
import { generateScalarField } from './generate-scalar-field.js';

describe('generateScalarField', () => {
  const dataUtilsImports = createTestTsImportMap(
    dataUtilsImportsSchema,
    'data-utils',
  );

  const prismaGeneratedImports = createTestTsImportMap(
    prismaGeneratedImportsSchema,
    'prisma',
  );

  describe('scalar types', () => {
    it('generates scalarField call for string type', () => {
      const result = generateScalarField({
        scalarType: 'string',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.string())');
      expect(result).toIncludeImport('z', 'zod');
      expect(result).toIncludeImport('scalarField', 'data-utils/scalarField');
    });

    it('generates scalarField call for int type', () => {
      const result = generateScalarField({
        scalarType: 'int',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.number().int())');
    });

    it('generates scalarField call for float type', () => {
      const result = generateScalarField({
        scalarType: 'float',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.number())');
    });

    it('generates scalarField call for decimal type', () => {
      const result = generateScalarField({
        scalarType: 'decimal',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.number())');
    });

    it('generates scalarField call for boolean type', () => {
      const result = generateScalarField({
        scalarType: 'boolean',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.boolean())');
    });

    it('generates scalarField call for date type', () => {
      const result = generateScalarField({
        scalarType: 'date',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.date())');
    });

    it('generates scalarField call for dateTime type', () => {
      const result = generateScalarField({
        scalarType: 'dateTime',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.date())');
    });

    it('generates scalarField call for json type', () => {
      const result = generateScalarField({
        scalarType: 'json',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.unknown())');
    });

    it('generates scalarField call for jsonObject type', () => {
      const result = generateScalarField({
        scalarType: 'jsonObject',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.record(unknown()))');
    });

    it('generates scalarField call for uuid type', () => {
      const result = generateScalarField({
        scalarType: 'uuid',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.string().uuid())');
    });
  });

  describe('optional fields', () => {
    it('generates scalarField with nullish for optional string', () => {
      const result = generateScalarField({
        scalarType: 'string',
        isOptional: true,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.string().nullish())');
    });

    it('generates scalarField with nullish for optional int', () => {
      const result = generateScalarField({
        scalarType: 'int',
        isOptional: true,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.number().int().nullish())');
    });
  });

  describe('enum type', () => {
    it('generates scalarField with nativeEnum for enum type', () => {
      const result = generateScalarField({
        scalarType: 'enum',
        enumName: 'Status',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe('scalarField(z.nativeEnum($Enums.Status))');
      expect(result).toIncludeImport('z', 'zod');
      expect(result).toIncludeImport('$Enums', 'prisma/$Enums');
      expect(result).toIncludeImport('scalarField', 'data-utils/scalarField');
    });

    it('generates scalarField with nullish for optional enum', () => {
      const result = generateScalarField({
        scalarType: 'enum',
        enumName: 'Status',
        isOptional: true,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      expect(result.contents).toBe(
        'scalarField(z.nativeEnum($Enums.Status).nullish())',
      );
    });

    it('throws error when enum name is missing for enum type', () => {
      expect(() =>
        generateScalarField({
          scalarType: 'enum',
          isOptional: false,
          dataUtilsImports,
          prismaGeneratedImports,
        }),
      ).toThrow('Enum name is required for enum scalar type');
    });
  });

  describe('imports', () => {
    it('includes all required imports', () => {
      const result = generateScalarField({
        scalarType: 'string',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      // Should have 2 imports: z from zod, scalarField from data-utils/scalarField
      expect(result.imports).toHaveLength(2);
      expect(result).toIncludeImport('z', 'zod');
      expect(result).toIncludeImport('scalarField', 'data-utils/scalarField');
    });

    it('includes $Enums import for enum types', () => {
      const result = generateScalarField({
        scalarType: 'enum',
        enumName: 'Status',
        isOptional: false,
        dataUtilsImports,
        prismaGeneratedImports,
      });

      // Should have 3 imports: z, scalarField, $Enums
      expect(result.imports).toHaveLength(3);
      expect(result).toIncludeImport('z', 'zod');
      expect(result).toIncludeImport('scalarField', 'data-utils/scalarField');
      expect(result).toIncludeImport('$Enums', 'prisma/$Enums');
    });
  });
});
