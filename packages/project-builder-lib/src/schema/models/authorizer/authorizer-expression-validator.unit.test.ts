import { describe, expect, it } from 'vitest';

import type { AuthRole } from '#src/plugins/spec/auth-config-spec.js';
import type { PluginSpecStore } from '#src/plugins/store/index.js';

import { authConfigSpec } from '#src/plugins/spec/auth-config-spec.js';

import type {
  BinaryLogicalNode,
  FieldComparisonNode,
  HasRoleNode,
  HasSomeRoleNode,
  NestedHasRoleNode,
  NestedHasSomeRoleNode,
} from './authorizer-expression-ast.js';

import {
  createModelValidationContext,
  validateAuthorizerExpression,
} from './authorizer-expression-validator.js';

/**
 * Create a mock PluginSpecStore with the specified roles.
 */
function createMockPluginStore(roles: AuthRole[]): PluginSpecStore {
  return {
    use: (spec: typeof authConfigSpec) => {
      if (spec.name === authConfigSpec.name) {
        return {
          getAuthConfig: () => ({ roles }),
        };
      }
      throw new Error(`No implementation for ${spec.name}`);
    },
  } as unknown as PluginSpecStore;
}

describe('validateAuthorizerExpression', () => {
  const defaultModelContext = createModelValidationContext({
    name: 'Post',
    fields: [{ name: 'id' }, { name: 'authorId' }, { name: 'title' }],
  });

  const defaultPluginStore = createMockPluginStore([
    { id: '1', name: 'admin', comment: 'Admin role', builtIn: false },
    { id: '2', name: 'editor', comment: 'Editor role', builtIn: false },
  ]);
  const defaultDefinition = {};

  describe('field comparison validation', () => {
    it('should validate valid model field reference', () => {
      const ast: FieldComparisonNode = {
        type: 'fieldComparison',
        operator: '===',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'id',
          start: 0,
          end: 8,
        },
        right: {
          type: 'fieldRef',
          source: 'auth',
          field: 'userId',
          start: 13,
          end: 24,
        },
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toEqual([]);
    });

    it('should warn for invalid model field reference', () => {
      const ast: FieldComparisonNode = {
        type: 'fieldComparison',
        operator: '===',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'nonexistent',
          start: 0,
          end: 15,
        },
        right: {
          type: 'fieldRef',
          source: 'auth',
          field: 'userId',
          start: 20,
          end: 31,
        },
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'nonexistent'");
      expect(warnings[0].message).toContain("'Post'");
    });

    it('should validate valid auth field reference (userId)', () => {
      const ast: FieldComparisonNode = {
        type: 'fieldComparison',
        operator: '===',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'authorId',
          start: 0,
          end: 14,
        },
        right: {
          type: 'fieldRef',
          source: 'auth',
          field: 'userId',
          start: 19,
          end: 30,
        },
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toEqual([]);
    });

    it('should warn for invalid auth field reference', () => {
      const ast: FieldComparisonNode = {
        type: 'fieldComparison',
        operator: '===',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'id',
          start: 0,
          end: 8,
        },
        right: {
          type: 'fieldRef',
          source: 'auth',
          field: 'invalidField',
          start: 13,
          end: 29,
        },
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'invalidField'");
      expect(warnings[0].message).toContain('userId');
    });
  });

  describe('hasRole validation', () => {
    it('should validate role that exists in project', () => {
      const ast: HasRoleNode = {
        type: 'hasRole',
        role: 'admin',
        roleStart: 13,
        roleEnd: 20,
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toEqual([]);
    });

    it('should warn for built-in role in hasRole', () => {
      const pluginStore = createMockPluginStore([
        { id: '1', name: 'admin', comment: 'Admin role', builtIn: false },
        { id: '2', name: 'system', comment: 'System role', builtIn: true },
      ]);
      const ast: HasRoleNode = {
        type: 'hasRole',
        role: 'system',
        roleStart: 13,
        roleEnd: 21,
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        pluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'system'");
      expect(warnings[0].message).toContain('built-in');
    });

    it('should warn for role that does not exist in project', () => {
      const ast: HasRoleNode = {
        type: 'hasRole',
        role: 'superuser',
        roleStart: 13,
        roleEnd: 24,
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'superuser'");
      expect(warnings[0].message).toContain('not defined');
    });
  });

  describe('hasSomeRole validation', () => {
    it('should validate all roles that exist in project', () => {
      const ast: HasSomeRoleNode = {
        type: 'hasSomeRole',
        roles: ['admin', 'editor'],
        rolesStart: [12, 21],
        rolesEnd: [19, 29],
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toEqual([]);
    });

    it('should warn for each role that does not exist in project', () => {
      const ast: HasSomeRoleNode = {
        type: 'hasSomeRole',
        roles: ['superuser', 'moderator'],
        rolesStart: [12, 25],
        rolesEnd: [23, 36],
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(2);
      expect(warnings[0].message).toContain("'superuser'");
      expect(warnings[0].message).toContain('not defined');
      expect(warnings[0].start).toBe(12);
      expect(warnings[0].end).toBe(23);

      expect(warnings[1].message).toContain("'moderator'");
      expect(warnings[1].message).toContain('not defined');
      expect(warnings[1].start).toBe(25);
      expect(warnings[1].end).toBe(36);
    });

    it('should warn for built-in role in hasSomeRole', () => {
      const pluginStore = createMockPluginStore([
        { id: '1', name: 'admin', comment: 'Admin role', builtIn: false },
        { id: '2', name: 'public', comment: 'Public role', builtIn: true },
        { id: '3', name: 'system', comment: 'System role', builtIn: true },
      ]);
      const ast: HasSomeRoleNode = {
        type: 'hasSomeRole',
        roles: ['admin', 'system'],
        rolesStart: [12, 21],
        rolesEnd: [19, 29],
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        pluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'system'");
      expect(warnings[0].message).toContain('built-in');
      expect(warnings[0].start).toBe(21);
      expect(warnings[0].end).toBe(29);
    });

    it('should warn only for invalid roles in mixed list', () => {
      const ast: HasSomeRoleNode = {
        type: 'hasSomeRole',
        roles: ['admin', 'superuser', 'editor'],
        rolesStart: [12, 21, 34],
        rolesEnd: [19, 32, 42],
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'superuser'");
      expect(warnings[0].start).toBe(21);
      expect(warnings[0].end).toBe(32);
    });
  });

  describe('nested hasRole validation', () => {
    const modelContextWithRelations = {
      modelName: 'Todo',
      scalarFieldNames: new Set(['id', 'todoListId']),
      relationInfo: new Map([
        [
          'todoList',
          {
            referenceCount: 1,
            foreignModelName: 'TodoList',
            foreignAuthorizerRoleNames: new Set(['owner', 'editor']),
          },
        ],
        [
          'compositeRelation',
          {
            referenceCount: 2,
            foreignModelName: 'Other',
            foreignAuthorizerRoleNames: new Set(['admin']),
          },
        ],
      ]),
    };

    it('should validate valid nested hasRole', () => {
      const ast: NestedHasRoleNode = {
        type: 'nestedHasRole',
        relationName: 'todoList',
        relationStart: 8,
        relationEnd: 22,
        role: 'owner',
        roleStart: 24,
        roleEnd: 31,
      };

      const warnings = validateAuthorizerExpression(
        ast,
        modelContextWithRelations,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toEqual([]);
    });

    it('should warn for nonexistent relation', () => {
      const ast: NestedHasRoleNode = {
        type: 'nestedHasRole',
        relationName: 'nonexistent',
        relationStart: 8,
        relationEnd: 22,
        role: 'owner',
        roleStart: 24,
        roleEnd: 31,
      };

      const warnings = validateAuthorizerExpression(
        ast,
        modelContextWithRelations,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'nonexistent'");
      expect(warnings[0].message).toContain("'Todo'");
    });

    it('should warn for composite FK relation', () => {
      const ast: NestedHasRoleNode = {
        type: 'nestedHasRole',
        relationName: 'compositeRelation',
        relationStart: 8,
        relationEnd: 30,
        role: 'admin',
        roleStart: 32,
        roleEnd: 39,
      };

      const warnings = validateAuthorizerExpression(
        ast,
        modelContextWithRelations,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('2 foreign key references');
      expect(warnings[0].message).toContain('single-key');
    });

    it('should warn for nonexistent role on foreign model', () => {
      const ast: NestedHasRoleNode = {
        type: 'nestedHasRole',
        relationName: 'todoList',
        relationStart: 8,
        relationEnd: 22,
        role: 'superuser',
        roleStart: 24,
        roleEnd: 35,
      };

      const warnings = validateAuthorizerExpression(
        ast,
        modelContextWithRelations,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'superuser'");
      expect(warnings[0].message).toContain("'TodoList'");
    });

    it('should validate valid nested hasSomeRole', () => {
      const ast: NestedHasSomeRoleNode = {
        type: 'nestedHasSomeRole',
        relationName: 'todoList',
        relationStart: 12,
        relationEnd: 26,
        roles: ['owner', 'editor'],
        rolesStart: [28, 37],
        rolesEnd: [35, 45],
      };

      const warnings = validateAuthorizerExpression(
        ast,
        modelContextWithRelations,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toEqual([]);
    });

    it('should warn for invalid roles in nested hasSomeRole', () => {
      const ast: NestedHasSomeRoleNode = {
        type: 'nestedHasSomeRole',
        relationName: 'todoList',
        relationStart: 12,
        relationEnd: 26,
        roles: ['owner', 'badRole'],
        rolesStart: [28, 37],
        rolesEnd: [35, 46],
      };

      const warnings = validateAuthorizerExpression(
        ast,
        modelContextWithRelations,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'badRole'");
      expect(warnings[0].message).toContain("'TodoList'");
    });

    it('should skip validation when no relationInfo provided', () => {
      const ast: NestedHasRoleNode = {
        type: 'nestedHasRole',
        relationName: 'todoList',
        relationStart: 8,
        relationEnd: 22,
        role: 'owner',
        roleStart: 24,
        roleEnd: 31,
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toEqual([]);
    });
  });

  describe('logical expression validation', () => {
    it('should validate nested expressions', () => {
      const ast: BinaryLogicalNode = {
        type: 'binaryLogical',
        operator: '||',
        left: {
          type: 'fieldComparison',
          operator: '===',
          left: {
            type: 'fieldRef',
            source: 'model',
            field: 'authorId',
            start: 0,
            end: 14,
          },
          right: {
            type: 'fieldRef',
            source: 'auth',
            field: 'userId',
            start: 19,
            end: 30,
          },
        },
        right: {
          type: 'hasRole',
          role: 'admin',
          roleStart: 47,
          roleEnd: 54,
        },
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toEqual([]);
    });

    it('should collect warnings from all parts of expression', () => {
      const ast: BinaryLogicalNode = {
        type: 'binaryLogical',
        operator: '||',
        left: {
          type: 'fieldComparison',
          operator: '===',
          left: {
            type: 'fieldRef',
            source: 'model',
            field: 'badField',
            start: 0,
            end: 14,
          },
          right: {
            type: 'fieldRef',
            source: 'auth',
            field: 'badAuth',
            start: 19,
            end: 30,
          },
        },
        right: {
          type: 'hasRole',
          role: 'badRole',
          roleStart: 47,
          roleEnd: 56,
        },
      };

      const warnings = validateAuthorizerExpression(
        ast,
        defaultModelContext,
        defaultPluginStore,
        defaultDefinition,
      );

      expect(warnings).toHaveLength(3);
      expect(warnings.some((w) => w.message.includes('badField'))).toBe(true);
      expect(warnings.some((w) => w.message.includes('badAuth'))).toBe(true);
      expect(warnings.some((w) => w.message.includes('badRole'))).toBe(true);
    });
  });
});

describe('createModelValidationContext', () => {
  it('should extract field names from model config', () => {
    const context = createModelValidationContext({
      name: 'User',
      fields: [{ name: 'id' }, { name: 'email' }, { name: 'name' }],
    });

    expect(context.modelName).toBe('User');
    expect(context.scalarFieldNames).toEqual(new Set(['id', 'email', 'name']));
  });

  it('should handle model with no fields', () => {
    const context = createModelValidationContext({
      name: 'EmptyModel',
    });

    expect(context.modelName).toBe('EmptyModel');
    expect(context.scalarFieldNames).toEqual(new Set());
  });

  it('should handle model with empty fields array', () => {
    const context = createModelValidationContext({
      name: 'EmptyModel',
      fields: [],
    });

    expect(context.modelName).toBe('EmptyModel');
    expect(context.scalarFieldNames).toEqual(new Set());
  });
});
