import { createTestTsImportMap } from '@baseplate-dev/core-generators/test-helpers';
import { describe, expect, it } from 'vitest';

import type { ServiceOutputEnum } from '#src/types/service-output.js';

import { prismaGeneratedImportsSchema } from '../../_providers/prisma-generated-imports.js';
import { dataUtilsImportsSchema } from '../../data-utils/generated/ts-import-providers.js';
import { generateScalarInputField } from './generate-scalar-input-field.js';

describe('generateScalarInputField', () => {
  const dataUtilsImports = createTestTsImportMap(
    dataUtilsImportsSchema,
    'data-utils',
  );

  const prismaGeneratedImports = createTestTsImportMap(
    prismaGeneratedImportsSchema,
    'prisma',
  );

  const baseScalarField = {
    name: 'field',
    id: false,
    type: 'scalar' as const,
    isOptional: false,
    isList: false,
    hasDefault: false,
    order: 0,
  };

  const lookupEnum: (name: string) => ServiceOutputEnum = (name) => ({
    name,
    values: [],
    expression: prismaGeneratedImports.$Enums.fragment(),
  });

  describe('scalar types', () => {
    it('generates scalarField call for string type', () => {
      const result = generateScalarInputField({
        fieldName: 'name',
        scalarField: { ...baseScalarField, name: 'name', scalarType: 'string' },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.name).toBe('name');
      expect(result.fragment.contents).toBe('scalarField(z.string())');
      expect(result.fragment).toIncludeImport('z', 'zod');
      expect(result.fragment).toIncludeImport(
        'scalarField',
        'data-utils/scalarField',
      );
    });

    it('generates scalarField call for int type', () => {
      const result = generateScalarInputField({
        fieldName: 'age',
        scalarField: { ...baseScalarField, name: 'age', scalarType: 'int' },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.int())');
    });

    it('generates scalarField call for float type', () => {
      const result = generateScalarInputField({
        fieldName: 'weight',
        scalarField: {
          ...baseScalarField,
          name: 'weight',
          scalarType: 'float',
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.number())');
    });

    it('generates scalarField call for decimal type', () => {
      const result = generateScalarInputField({
        fieldName: 'height',
        scalarField: {
          ...baseScalarField,
          name: 'height',
          scalarType: 'decimal',
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.number())');
    });

    it('generates scalarField call for boolean type', () => {
      const result = generateScalarInputField({
        fieldName: 'isActive',
        scalarField: {
          ...baseScalarField,
          name: 'isActive',
          scalarType: 'boolean',
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.boolean())');
    });

    it('generates scalarField call for date type', () => {
      const result = generateScalarInputField({
        fieldName: 'createdAt',
        scalarField: {
          ...baseScalarField,
          name: 'createdAt',
          scalarType: 'date',
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.date())');
    });

    it('generates scalarField call for dateTime type', () => {
      const result = generateScalarInputField({
        fieldName: 'updatedAt',
        scalarField: {
          ...baseScalarField,
          name: 'updatedAt',
          scalarType: 'dateTime',
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.date())');
    });

    it('generates scalarField call for json type', () => {
      const result = generateScalarInputField({
        fieldName: 'data',
        scalarField: { ...baseScalarField, name: 'data', scalarType: 'json' },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.unknown())');
    });

    it('generates scalarField call for jsonObject type', () => {
      const result = generateScalarInputField({
        fieldName: 'metadata',
        scalarField: {
          ...baseScalarField,
          name: 'metadata',
          scalarType: 'jsonObject',
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe(
        'scalarField(z.record(z.string(), z.unknown()))',
      );
    });

    it('generates scalarField call for uuid type', () => {
      const result = generateScalarInputField({
        fieldName: 'id',
        scalarField: { ...baseScalarField, name: 'id', scalarType: 'uuid' },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.uuid())');
    });
  });

  describe('optional fields', () => {
    it('generates scalarField with nullish for optional string', () => {
      const result = generateScalarInputField({
        fieldName: 'name',
        scalarField: {
          ...baseScalarField,
          name: 'name',
          scalarType: 'string',
          isOptional: true,
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe(
        'scalarField(z.string().nullish())',
      );
    });

    it('generates scalarField with nullish for optional int', () => {
      const result = generateScalarInputField({
        fieldName: 'age',
        scalarField: {
          ...baseScalarField,
          name: 'age',
          scalarType: 'int',
          isOptional: true,
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.int().nullish())');
    });
  });

  describe('fields with defaults', () => {
    it('generates scalarField with optional for string with default', () => {
      const result = generateScalarInputField({
        fieldName: 'name',
        scalarField: {
          ...baseScalarField,
          name: 'name',
          scalarType: 'string',
          hasDefault: true,
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe(
        'scalarField(z.string().optional())',
      );
    });

    it('generates scalarField with optional for int with default', () => {
      const result = generateScalarInputField({
        fieldName: 'age',
        scalarField: {
          ...baseScalarField,
          name: 'age',
          scalarType: 'int',
          hasDefault: true,
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe('scalarField(z.int().optional())');
    });

    it('generates scalarField with optional for enum with default', () => {
      const result = generateScalarInputField({
        fieldName: 'status',
        scalarField: {
          ...baseScalarField,
          name: 'status',
          scalarType: 'enum',
          enumType: 'Status',
          hasDefault: true,
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe(
        'scalarField(z.enum($Enums.Status).optional())',
      );
    });

    it('prioritizes nullish over optional when both isOptional and hasDefault are true', () => {
      const result = generateScalarInputField({
        fieldName: 'name',
        scalarField: {
          ...baseScalarField,
          name: 'name',
          scalarType: 'string',
          isOptional: true,
          hasDefault: true,
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe(
        'scalarField(z.string().nullish())',
      );
    });
  });

  describe('enum type', () => {
    it('generates scalarField with enum for enum type', () => {
      const result = generateScalarInputField({
        fieldName: 'status',
        scalarField: {
          ...baseScalarField,
          name: 'status',
          scalarType: 'enum',
          enumType: 'Status',
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe(
        'scalarField(z.enum($Enums.Status))',
      );
      expect(result.fragment).toIncludeImport('z', 'zod');
      expect(result.fragment).toIncludeImport('$Enums', 'prisma/$Enums');
      expect(result.fragment).toIncludeImport(
        'scalarField',
        'data-utils/scalarField',
      );
    });

    it('generates scalarField with nullish for optional enum', () => {
      const result = generateScalarInputField({
        fieldName: 'status',
        scalarField: {
          ...baseScalarField,
          name: 'status',
          scalarType: 'enum',
          enumType: 'Status',
          isOptional: true,
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.fragment.contents).toBe(
        'scalarField(z.enum($Enums.Status).nullish())',
      );
    });

    it('throws error when enum name is missing for enum type', () => {
      expect(() =>
        generateScalarInputField({
          fieldName: 'status',
          scalarField: {
            ...baseScalarField,
            name: 'status',
            scalarType: 'enum',
          },
          dataUtilsImports,
          prismaGeneratedImports,
          lookupEnum,
        }),
      ).toThrow('Enum name is required for enum scalar type');
    });
  });

  describe('imports', () => {
    it('includes all required imports', () => {
      const result = generateScalarInputField({
        fieldName: 'name',
        scalarField: { ...baseScalarField, name: 'name', scalarType: 'string' },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      // Should have 2 imports: z from zod, scalarField from data-utils/scalarField
      expect(result.fragment.imports).toHaveLength(2);
      expect(result.fragment).toIncludeImport('z', 'zod');
      expect(result.fragment).toIncludeImport(
        'scalarField',
        'data-utils/scalarField',
      );
    });

    it('includes $Enums import for enum types', () => {
      const result = generateScalarInputField({
        fieldName: 'status',
        scalarField: {
          ...baseScalarField,
          name: 'status',
          scalarType: 'enum',
          enumType: 'Status',
        },
        dataUtilsImports,
        prismaGeneratedImports,
        lookupEnum,
      });

      // Should have 3 imports: z, scalarField, $Enums
      expect(result.fragment.imports).toHaveLength(3);
      expect(result.fragment).toIncludeImport('z', 'zod');
      expect(result.fragment).toIncludeImport(
        'scalarField',
        'data-utils/scalarField',
      );
      expect(result.fragment).toIncludeImport('$Enums', 'prisma/$Enums');
    });
  });
});
