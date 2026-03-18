import { createTestTsImportMap } from '@baseplate-dev/core-generators/test-helpers';
import { describe, expect, it } from 'vitest';

import type { ServiceOutputEnum } from '#src/types/service-output.js';

import { prismaGeneratedImportsSchema } from '../../_providers/prisma-generated-imports.js';
import { generateScalarInputField } from './generate-scalar-input-field.js';

describe('generateScalarInputField', () => {
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
    it('generates Zod schema for string type', () => {
      const result = generateScalarInputField({
        fieldName: 'name',
        scalarField: { ...baseScalarField, name: 'name', scalarType: 'string' },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.name).toBe('name');
      expect(result.isTransformField).toBe(false);
      expect(result.schemaFragment.contents).toBe('z.string()');
      expect(result.schemaFragment).toIncludeImport('z', 'zod');
    });

    it('generates Zod schema for int type', () => {
      const result = generateScalarInputField({
        fieldName: 'age',
        scalarField: { ...baseScalarField, name: 'age', scalarType: 'int' },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.int()');
    });

    it('generates Zod schema for float type', () => {
      const result = generateScalarInputField({
        fieldName: 'weight',
        scalarField: {
          ...baseScalarField,
          name: 'weight',
          scalarType: 'float',
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.number()');
    });

    it('generates Zod schema for decimal type', () => {
      const result = generateScalarInputField({
        fieldName: 'height',
        scalarField: {
          ...baseScalarField,
          name: 'height',
          scalarType: 'decimal',
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.number()');
    });

    it('generates Zod schema for boolean type', () => {
      const result = generateScalarInputField({
        fieldName: 'isActive',
        scalarField: {
          ...baseScalarField,
          name: 'isActive',
          scalarType: 'boolean',
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.boolean()');
    });

    it('generates Zod schema for date type', () => {
      const result = generateScalarInputField({
        fieldName: 'createdAt',
        scalarField: {
          ...baseScalarField,
          name: 'createdAt',
          scalarType: 'date',
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.date()');
    });

    it('generates Zod schema for dateTime type', () => {
      const result = generateScalarInputField({
        fieldName: 'updatedAt',
        scalarField: {
          ...baseScalarField,
          name: 'updatedAt',
          scalarType: 'dateTime',
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.date()');
    });

    it('generates Zod schema for json type', () => {
      const result = generateScalarInputField({
        fieldName: 'data',
        scalarField: { ...baseScalarField, name: 'data', scalarType: 'json' },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe(
        'z.json().transform((val) => (val === null ? Prisma.JsonNull : val))',
      );
      expect(result.schemaFragment).toIncludeImport('Prisma', 'prisma/Prisma');
    });

    it('generates Zod schema for jsonObject type', () => {
      const result = generateScalarInputField({
        fieldName: 'metadata',
        scalarField: {
          ...baseScalarField,
          name: 'metadata',
          scalarType: 'jsonObject',
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe(
        'z.record(z.string(), z.unknown())',
      );
    });

    it('generates Zod schema for uuid type', () => {
      const result = generateScalarInputField({
        fieldName: 'id',
        scalarField: { ...baseScalarField, name: 'id', scalarType: 'uuid' },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.uuid()');
    });
  });

  describe('optional fields', () => {
    it('generates Zod schema with nullish for optional string', () => {
      const result = generateScalarInputField({
        fieldName: 'name',
        scalarField: {
          ...baseScalarField,
          name: 'name',
          scalarType: 'string',
          isOptional: true,
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.string().nullish()');
    });

    it('generates Zod schema with nullish for optional int', () => {
      const result = generateScalarInputField({
        fieldName: 'age',
        scalarField: {
          ...baseScalarField,
          name: 'age',
          scalarType: 'int',
          isOptional: true,
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.int().nullish()');
    });
  });

  describe('fields with defaults', () => {
    it('generates Zod schema with optional for string with default', () => {
      const result = generateScalarInputField({
        fieldName: 'name',
        scalarField: {
          ...baseScalarField,
          name: 'name',
          scalarType: 'string',
          hasDefault: true,
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.string().optional()');
    });

    it('generates Zod schema with optional for int with default', () => {
      const result = generateScalarInputField({
        fieldName: 'age',
        scalarField: {
          ...baseScalarField,
          name: 'age',
          scalarType: 'int',
          hasDefault: true,
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.int().optional()');
    });

    it('generates Zod schema with optional for enum with default', () => {
      const result = generateScalarInputField({
        fieldName: 'status',
        scalarField: {
          ...baseScalarField,
          name: 'status',
          scalarType: 'enum',
          enumType: 'Status',
          hasDefault: true,
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe(
        'z.enum($Enums.Status).optional()',
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
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.string().nullish()');
    });
  });

  describe('enum type', () => {
    it('generates Zod schema with enum for enum type', () => {
      const result = generateScalarInputField({
        fieldName: 'status',
        scalarField: {
          ...baseScalarField,
          name: 'status',
          scalarType: 'enum',
          enumType: 'Status',
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe('z.enum($Enums.Status)');
      expect(result.schemaFragment).toIncludeImport('z', 'zod');
      expect(result.schemaFragment).toIncludeImport('$Enums', 'prisma/$Enums');
    });

    it('generates Zod schema with nullish for optional enum', () => {
      const result = generateScalarInputField({
        fieldName: 'status',
        scalarField: {
          ...baseScalarField,
          name: 'status',
          scalarType: 'enum',
          enumType: 'Status',
          isOptional: true,
        },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.contents).toBe(
        'z.enum($Enums.Status).nullish()',
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
          prismaGeneratedImports,
          lookupEnum,
        }),
      ).toThrow('Enum name is required for enum scalar type');
    });
  });

  describe('imports', () => {
    it('includes z import only for scalar fields', () => {
      const result = generateScalarInputField({
        fieldName: 'name',
        scalarField: { ...baseScalarField, name: 'name', scalarType: 'string' },
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.imports).toHaveLength(1);
      expect(result.schemaFragment).toIncludeImport('z', 'zod');
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
        prismaGeneratedImports,
        lookupEnum,
      });

      expect(result.schemaFragment.imports).toHaveLength(2);
      expect(result.schemaFragment).toIncludeImport('z', 'zod');
      expect(result.schemaFragment).toIncludeImport('$Enums', 'prisma/$Enums');
    });
  });
});
