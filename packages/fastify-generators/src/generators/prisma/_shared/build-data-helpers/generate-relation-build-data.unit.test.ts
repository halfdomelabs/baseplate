import { createTestTsImportMap } from '@baseplate-dev/core-generators/test-helpers';
import { describe, expect, it } from 'vitest';

import type { PrismaOutputModel } from '#src/types/prisma-output.js';

import {
  createMockRelationField,
  createMockScalarField,
} from '#src/types/prisma-output.test-helper.js';

import { dataUtilsImportsSchema } from '../../data-utils/generated/ts-import-providers.js';
import { generateRelationBuildData } from './generate-relation-build-data.js';

const mockDataUtilsImports = createTestTsImportMap(
  dataUtilsImportsSchema,
  'data-utils',
);

describe('generateRelationBuildData', () => {
  describe('single relation with single FK field', () => {
    it('should generate buildData for a single required relation', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'TodoList',
        fields: [
          createMockScalarField('id'),
          createMockScalarField('name'),
          createMockScalarField('ownerId'),
          createMockRelationField('owner', ['ownerId'], ['id']),
        ],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['name', 'ownerId'],
        operationType: 'create',
        dataUtilsImports: mockDataUtilsImports,
      });

      expect(result.buildDataFunctionFragment.contents).toMatchInlineSnapshot(`
        "({ ownerId, ...data }) => ({...data,
        owner: relationHelpers.connectCreate({id: ownerId,}),})"
      `);
    });

    it('should generate buildData for a single optional relation', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'TodoItem',
        fields: [
          createMockScalarField('id'),
          createMockScalarField('text'),
          createMockScalarField('assigneeId'),
          createMockRelationField('assignee', ['assigneeId'], ['id'], true),
        ],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['text', 'assigneeId'],
        operationType: 'create',
        dataUtilsImports: mockDataUtilsImports,
      });

      expect(result.buildDataFunctionFragment.contents).toMatchInlineSnapshot(`
        "({ assigneeId, ...data }) => ({...data,
        assignee: relationHelpers.connectCreate({id: assigneeId,}),})"
      `);
    });
  });

  describe('multiple relations', () => {
    it('should generate buildData for multiple relations', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'TodoItem',
        fields: [
          createMockScalarField('id'),
          createMockScalarField('text'),
          createMockScalarField('todoListId'),
          createMockScalarField('assigneeId'),
          createMockRelationField('todoList', ['todoListId'], ['id']),
          createMockRelationField('assignee', ['assigneeId'], ['id'], true),
        ],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['text', 'todoListId', 'assigneeId'],
        operationType: 'create',
        dataUtilsImports: mockDataUtilsImports,
      });

      expect(result.buildDataFunctionFragment.contents).toMatchInlineSnapshot(`
        "({ assigneeId, todoListId, ...data }) => ({...data,
        todoList: relationHelpers.connectCreate({id: todoListId,}),
        assignee: relationHelpers.connectCreate({id: assigneeId,}),})"
      `);
    });
  });

  describe('composite key relations', () => {
    it('should generate buildData for a composite key relation', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'Resource',
        fields: [
          createMockScalarField('id'),
          createMockScalarField('name'),
          createMockScalarField('userId'),
          createMockScalarField('tenantId'),
          createMockRelationField(
            'owner',
            ['userId', 'tenantId'],
            ['id', 'tenantId'],
          ),
        ],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['name', 'userId', 'tenantId'],
        operationType: 'create',
        dataUtilsImports: mockDataUtilsImports,
      });

      expect(result.buildDataFunctionFragment.contents).toMatchInlineSnapshot(`
        "({ tenantId, userId, ...data }) => ({...data,
        owner: relationHelpers.connectCreate({id: userId,
        tenantId,}),})"
      `);
    });

    it('should use shorthand syntax when FK field matches reference field', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'Resource',
        fields: [
          createMockScalarField('id'),
          createMockScalarField('name'),
          createMockScalarField('tenantId'),
          createMockScalarField('organizationId'),
          createMockRelationField(
            'owner',
            ['tenantId', 'organizationId'],
            ['tenantId', 'organizationId'],
          ),
        ],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['name', 'tenantId', 'organizationId'],
        operationType: 'create',
        dataUtilsImports: mockDataUtilsImports,
      });

      // Should use shorthand syntax for matching field names
      expect(result.buildDataFunctionFragment.contents).toMatchInlineSnapshot(`
        "({ organizationId, tenantId, ...data }) => ({...data,
        owner: relationHelpers.connectCreate({organizationId,
        tenantId,}),})"
      `);
    });
  });

  describe('no relations', () => {
    it('should generate pass-through function when no FK fields in input', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'TodoList',
        fields: [
          createMockScalarField('id'),
          createMockScalarField('name'),
          createMockScalarField('ownerId'),
          createMockRelationField('owner', ['ownerId'], ['id']),
        ],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['name'], // ownerId not included
        operationType: 'create',
        dataUtilsImports: mockDataUtilsImports,
      });

      const generatedCode = result.buildDataFunctionFragment.contents;
      expect(generatedCode).toBe('(data) => (data)');
    });

    it('should generate pass-through function when model has no relations', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'Simple',
        fields: [createMockScalarField('id'), createMockScalarField('name')],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['name'],
        operationType: 'create',
        dataUtilsImports: mockDataUtilsImports,
      });

      const generatedCode = result.buildDataFunctionFragment.contents;
      expect(generatedCode).toBe('(data) => (data)');
    });
  });

  describe('all fields are foreign keys', () => {
    it('should not include spread operator when all input fields are FKs', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'Junction',
        fields: [
          createMockScalarField('userId'),
          createMockScalarField('projectId'),
          createMockRelationField('user', ['userId'], ['id']),
          createMockRelationField('project', ['projectId'], ['id']),
        ],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['userId', 'projectId'], // Only FK fields
        operationType: 'create',
        dataUtilsImports: mockDataUtilsImports,
      });

      // Should not include spread operator when all input fields are FKs
      expect(result.buildDataFunctionFragment.contents).toMatchInlineSnapshot(`
        "({ projectId, userId }) => ({project: relationHelpers.connectCreate({id: projectId,}),
        user: relationHelpers.connectCreate({id: userId,}),})"
      `);
    });
  });

  describe('operation types', () => {
    it('should use connectCreate for create operations', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'TodoList',
        fields: [
          createMockScalarField('id'),
          createMockScalarField('name'),
          createMockScalarField('ownerId'),
          createMockRelationField('owner', ['ownerId'], ['id']),
        ],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['name', 'ownerId'],
        operationType: 'create',
        dataUtilsImports: mockDataUtilsImports,
      });

      expect(result.buildDataFunctionFragment.contents).toMatchInlineSnapshot(`
        "({ ownerId, ...data }) => ({...data,
        owner: relationHelpers.connectCreate({id: ownerId,}),})"
      `);
    });

    it('should use connectUpdate for update operations', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'TodoList',
        fields: [
          createMockScalarField('id'),
          createMockScalarField('name'),
          createMockScalarField('ownerId'),
          createMockRelationField('owner', ['ownerId'], ['id']),
        ],
        idFields: null,
      };

      const result = generateRelationBuildData({
        prismaModel,
        inputFieldNames: ['name', 'ownerId'],
        operationType: 'update',
        dataUtilsImports: mockDataUtilsImports,
      });

      expect(result.buildDataFunctionFragment.contents).toMatchInlineSnapshot(`
        "({ ownerId, ...data }) => ({...data,
        owner: relationHelpers.connectUpdate({id: ownerId,}),})"
      `);
    });
  });

  describe('partial FK fields', () => {
    it('should include relation if at least one FK field is in input', () => {
      const prismaModel: PrismaOutputModel = {
        name: 'Resource',
        fields: [
          createMockScalarField('id'),
          createMockScalarField('name'),
          createMockScalarField('userId'),
          createMockScalarField('tenantId'),
          createMockRelationField(
            'owner',
            ['userId', 'tenantId'],
            ['id', 'tenantId'],
          ),
        ],
        idFields: null,
      };

      // This should throw an error because not all FK fields are provided
      expect(() =>
        generateRelationBuildData({
          prismaModel,
          inputFieldNames: ['name', 'userId'], // tenantId not included - missing required FK field
          operationType: 'create',
          dataUtilsImports: mockDataUtilsImports,
        }),
      ).toThrow(
        'Relation owner requires all fields as inputs (missing tenantId)',
      );
    });
  });
});
