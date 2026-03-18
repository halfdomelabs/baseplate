import { TsCodeUtils } from '@baseplate-dev/core-generators';
import { createTestTsImportMap } from '@baseplate-dev/core-generators/test-helpers';
import { describe, expect, it, vi } from 'vitest';

import type { InputFieldDefinitionOutput } from '../field-definition-generators/types.js';

import { dataUtilsImportsSchema } from '../../data-utils/generated/ts-import-providers.js';
import { buildTransformOperationParts } from './build-transform-operation-parts.js';

const dataUtilsImports = createTestTsImportMap(
  dataUtilsImportsSchema,
  'data-utils',
);

function createMockScalarField(name: string): InputFieldDefinitionOutput {
  return {
    name,
    schemaFragment: TsCodeUtils.frag(`z.string()`),
    isTransformField: false,
    outputDtoField: { name, type: 'scalar', scalarType: 'string' },
  };
}

function createMockTransformField(
  name: string,
  overrides?: Partial<NonNullable<InputFieldDefinitionOutput['transformer']>>,
): InputFieldDefinitionOutput {
  return {
    name,
    schemaFragment: TsCodeUtils.frag(`z.object({})`),
    isTransformField: true,
    transformer: {
      fragment: TsCodeUtils.frag(`mockTransformer()`),
      needsExistingItem: false,
      buildForCreateEntry: vi.fn(({ transformersVarFragment }) =>
        TsCodeUtils.frag(
          `${String(transformersVarFragment)}.${name}.forCreate(${name})`,
        ),
      ),
      buildForUpdateEntry: vi.fn(
        ({ transformersVarFragment, existingItemVarName }) =>
          TsCodeUtils.frag(
            `${String(transformersVarFragment)}.${name}.forUpdate(${name}, ${existingItemVarName}.${name}Id)`,
          ),
      ),
      ...overrides,
    },
    outputDtoField: {
      name,
      type: 'scalar',
      scalarType: 'string',
    },
  };
}

/** Minimal PrismaOutputModel with no relations */
function createMockModel(
  idFields: string[] = ['id'],
  relations: {
    name: string;
    fields: string[];
    references: string[];
    modelType: string;
  }[] = [],
): Parameters<typeof buildTransformOperationParts>[0]['prismaModel'] {
  return {
    name: 'TestModel',
    fields: [
      ...idFields.map((name, i) => ({
        type: 'scalar' as const,
        name,
        id: true,
        scalarType: 'string' as const,
        isOptional: false,
        isList: false,
        hasDefault: false,
        order: i,
      })),
      ...relations.map((rel, i) => ({
        type: 'relation' as const,
        name: rel.name,
        id: false,
        isList: false,
        isOptional: false,
        hasDefault: false,
        modelType: rel.modelType,
        fields: rel.fields,
        references: rel.references,
        relationName: `${rel.name}Relation`,
        order: idFields.length + i,
      })),
    ],
    idFields,
  };
}

describe('buildTransformOperationParts', () => {
  describe('scalar-only fields', () => {
    it('should pass data through when no transform fields or FK relations', () => {
      const result = buildTransformOperationParts({
        fields: [createMockScalarField('name'), createMockScalarField('email')],
        prismaModel: createMockModel(),
        dataUtilsImports,
        operationType: 'create',
      });

      expect(result.hasDestructure).toBe(false);
      expect(result.inputDestructureFragment).toBe('');
      expect(result.dataName).toBe('data');
      expect(result.prismaDataFragment).toBe('data');
      expect(result.hasTransformFields).toBe(false);
      expect(result.transformersObjectFragment).toBeUndefined();
      expect(result.transformFieldNames).toEqual([]);
    });

    it('should omit ID fields on update operations', () => {
      const result = buildTransformOperationParts({
        fields: [createMockScalarField('id'), createMockScalarField('name')],
        prismaModel: createMockModel(['id']),
        dataUtilsImports,
        operationType: 'update',
      });

      // ID field should be omitted from the data
      expect(result.prismaDataFragment).toHaveProperty('contents');
      expect(
        (result.prismaDataFragment as { contents: string }).contents,
      ).toContain('omit');
      expect(
        (result.prismaDataFragment as { contents: string }).contents,
      ).toContain("'id'");
    });

    it('should not omit ID fields on create operations', () => {
      const result = buildTransformOperationParts({
        fields: [createMockScalarField('id'), createMockScalarField('name')],
        prismaModel: createMockModel(['id']),
        dataUtilsImports,
        operationType: 'create',
      });

      expect(result.prismaDataFragment).toBe('data');
    });
  });

  describe('transform fields', () => {
    it('should destructure transform fields from input', () => {
      const result = buildTransformOperationParts({
        fields: [
          createMockScalarField('name'),
          createMockTransformField('coverPhoto'),
        ],
        prismaModel: createMockModel(),
        dataUtilsImports,
        operationType: 'create',
        transformersVarFragment: 'testTransformers',
      });

      expect(result.hasDestructure).toBe(true);
      expect(result.transformFieldNames).toEqual(['coverPhoto']);
      expect(result.dataName).toBe('rest');
      expect(result.hasTransformFields).toBe(true);
    });

    it('should invoke buildForCreateEntry for create operations', () => {
      const field = createMockTransformField('coverPhoto');
      buildTransformOperationParts({
        fields: [createMockScalarField('name'), field],
        prismaModel: createMockModel(),
        dataUtilsImports,
        operationType: 'create',
        transformersVarFragment: 'testTransformers',
      });

      expect(field.transformer?.buildForCreateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          transformersVarFragment: 'testTransformers',
        }),
      );
    });

    it('should invoke buildForUpdateEntry for update operations', () => {
      const field = createMockTransformField('coverPhoto');
      buildTransformOperationParts({
        fields: [createMockScalarField('name'), field],
        prismaModel: createMockModel(),
        dataUtilsImports,
        operationType: 'update',
        transformersVarFragment: 'testTransformers',
        existingItemVarName: 'existing',
        loadExistingVarName: 'where',
      });

      expect(field.transformer?.buildForUpdateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          transformersVarFragment: 'testTransformers',
          existingItemVarName: 'existing',
          loadExistingVarName: 'where',
        }),
      );
    });

    it('should pass loadExistingVarName through to callbacks', () => {
      const field = createMockTransformField('attachments');
      buildTransformOperationParts({
        fields: [field],
        prismaModel: createMockModel(),
        dataUtilsImports,
        operationType: 'update',
        transformersVarFragment: 'testTransformers',
        existingItemVarName: 'existingItem',
        loadExistingVarName: 'existingItem',
      });

      expect(field.transformer?.buildForUpdateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          loadExistingVarName: 'existingItem',
        }),
      );
    });

    it('should not build transformers object when no transformersVarFragment is provided', () => {
      const result = buildTransformOperationParts({
        fields: [createMockTransformField('coverPhoto')],
        prismaModel: createMockModel(),
        dataUtilsImports,
        operationType: 'create',
      });

      expect(result.hasTransformFields).toBe(true);
      expect(result.transformersObjectFragment).toBeUndefined();
    });

    it('should throw when transform field has no transformer definition', () => {
      const badField: InputFieldDefinitionOutput = {
        name: 'broken',
        schemaFragment: TsCodeUtils.frag('z.string()'),
        isTransformField: true,
        outputDtoField: {
          name: 'broken',
          type: 'scalar',
          scalarType: 'string',
        },
      };

      expect(() =>
        buildTransformOperationParts({
          fields: [badField],
          prismaModel: createMockModel(),
          dataUtilsImports,
          operationType: 'create',
          transformersVarFragment: 'transformers',
        }),
      ).toThrow("Transform field 'broken' has no transformer definition");
    });
  });

  describe('mixed scalar + transform fields', () => {
    it('should destructure only transform and FK fields', () => {
      const result = buildTransformOperationParts({
        fields: [
          createMockScalarField('name'),
          createMockScalarField('email'),
          createMockTransformField('avatar'),
        ],
        prismaModel: createMockModel(),
        dataUtilsImports,
        operationType: 'create',
        transformersVarFragment: 'testTransformers',
      });

      expect(result.hasDestructure).toBe(true);
      expect(result.transformFieldNames).toEqual(['avatar']);
      expect(result.dataName).toBe('rest');
      // The destructure should contain the transform field name
      expect(
        (result.inputDestructureFragment as { contents: string }).contents,
      ).toContain('avatar');
      // Scalar fields should NOT be in the destructure
      expect(
        (result.inputDestructureFragment as { contents: string }).contents,
      ).not.toContain('name');
    });
  });

  describe('FK relation handling', () => {
    it('should destructure FK fields and include relation entries', () => {
      const result = buildTransformOperationParts({
        fields: [
          createMockScalarField('name'),
          createMockScalarField('ownerId'),
        ],
        prismaModel: createMockModel(
          ['id'],
          [
            {
              name: 'owner',
              fields: ['ownerId'],
              references: ['id'],
              modelType: 'User',
            },
          ],
        ),
        dataUtilsImports,
        operationType: 'create',
      });

      expect(result.hasDestructure).toBe(true);
      expect(result.foreignKeyFieldNames).toEqual(['ownerId']);
      expect(result.createRelationEntries).toHaveProperty('owner');
    });
  });

  describe('custom input variable name', () => {
    it('should use custom inputVarName in destructure', () => {
      const result = buildTransformOperationParts({
        fields: [createMockTransformField('file')],
        prismaModel: createMockModel(),
        dataUtilsImports,
        operationType: 'create',
        inputVarName: 'itemInput',
        transformersVarFragment: 'transformers',
      });

      expect(
        (result.inputDestructureFragment as { contents: string }).contents,
      ).toContain('itemInput');
    });
  });
});
