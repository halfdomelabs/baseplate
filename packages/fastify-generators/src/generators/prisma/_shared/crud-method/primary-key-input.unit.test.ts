import { describe, expect, it } from 'vitest';

import type { PrismaOutputModel } from '#src/types/prisma-output.js';

import { createMockScalarField } from '#src/types/prisma-output.test-helper.js';

import {
  generateGetWhereUniqueFragment,
  getModelIdFieldName,
  getPrimaryKeyDefinition,
} from './primary-key-input.js';

describe('generateGetWhereUniqueFragment', () => {
  describe('single primary key', () => {
    it('should generate fragment for single id field', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'User',
        fields: [createMockScalarField('id'), createMockScalarField('email')],
        idFields: ['id'],
      };

      const result = generateGetWhereUniqueFragment(prismaModel);

      expect(result).toBe('(result) => ({ id: result.id })');
    });

    it('should generate fragment for non-id primary key field', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'User',
        fields: [createMockScalarField('email'), createMockScalarField('name')],
        idFields: ['email'],
      };

      const result = generateGetWhereUniqueFragment(prismaModel);

      expect(result).toBe('(result) => ({ email: result.email })');
    });
  });

  describe('compound primary key', () => {
    it('should generate fragment for two-field compound key', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'TodoListShare',
        fields: [
          createMockScalarField('todoListId'),
          createMockScalarField('userId'),
        ],
        idFields: ['todoListId', 'userId'],
      };

      const result = generateGetWhereUniqueFragment(prismaModel);

      expect(result).toBe(
        '(result) => ({ todoListId_userId: { todoListId: result.todoListId, userId: result.userId } })',
      );
    });

    it('should generate fragment for three-field compound key', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'Permission',
        fields: [
          createMockScalarField('tenantId'),
          createMockScalarField('userId'),
          createMockScalarField('resourceId'),
        ],
        idFields: ['tenantId', 'userId', 'resourceId'],
      };

      const result = generateGetWhereUniqueFragment(prismaModel);

      expect(result).toBe(
        '(result) => ({ tenantId_userId_resourceId: { tenantId: result.tenantId, userId: result.userId, resourceId: result.resourceId } })',
      );
    });
  });

  describe('error handling', () => {
    it('should throw error when model has no primary key', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'Invalid',
        fields: [createMockScalarField('name')],
        idFields: null,
      };

      expect(() => generateGetWhereUniqueFragment(prismaModel)).toThrow(
        'Model Invalid has no primary key',
      );
    });

    it('should throw error when idFields is empty array', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'Invalid',
        fields: [createMockScalarField('name')],
        idFields: [],
      };

      expect(() => generateGetWhereUniqueFragment(prismaModel)).toThrow(
        'Model Invalid has no primary key',
      );
    });
  });
});

describe('getModelIdFieldName', () => {
  it('should return field name for single primary key', () => {
    const prismaModel: PrismaOutputModel = {
      name: 'User',
      fields: [createMockScalarField('id')],
      idFields: ['id'],
    };

    expect(getModelIdFieldName(prismaModel)).toBe('id');
  });

  it('should return joined field names for compound key', () => {
    const prismaModel: PrismaOutputModel = {
      name: 'TodoListShare',
      fields: [
        createMockScalarField('todoListId'),
        createMockScalarField('userId'),
      ],
      idFields: ['todoListId', 'userId'],
    };

    expect(getModelIdFieldName(prismaModel)).toBe('todoListId_userId');
  });
});

describe('getPrimaryKeyDefinition', () => {
  it('should return scalar definition for single primary key', () => {
    const prismaModel: PrismaOutputModel = {
      name: 'User',
      fields: [createMockScalarField('id')],
      idFields: ['id'],
    };

    const result = getPrimaryKeyDefinition(prismaModel);

    expect(result).toEqual({
      name: 'id',
      type: 'scalar',
      scalarType: 'string',
    });
  });

  it('should return nested definition for compound primary key', () => {
    const prismaModel: PrismaOutputModel = {
      name: 'TodoListShare',
      fields: [
        createMockScalarField('todoListId'),
        createMockScalarField('userId'),
      ],
      idFields: ['todoListId', 'userId'],
    };

    const result = getPrimaryKeyDefinition(prismaModel);

    expect(result).toEqual({
      name: 'id',
      type: 'nested',
      nestedType: {
        name: 'TodoListSharePrimaryKey',
        fields: [
          { name: 'todoListId', type: 'scalar', scalarType: 'string' },
          { name: 'userId', type: 'scalar', scalarType: 'string' },
        ],
      },
    });
  });
});
