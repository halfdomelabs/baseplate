import { describe, expect, it } from 'vitest';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { PluginImplementationStore } from '#src/plugins/schema/store.js';
import type { AuthRole } from '#src/plugins/spec/auth-config-spec.js';

import { authConfigSpec } from '#src/plugins/spec/auth-config-spec.js';

import type {
  BinaryLogicalNode,
  FieldComparisonNode,
  HasRoleNode,
} from './authorizer-expression-ast.js';

import {
  createModelValidationContext,
  validateAuthorizerExpression,
} from './authorizer-expression-validator.js';

/**
 * Create a mock ProjectDefinitionContainer with the specified roles.
 */
function createMockContainer(roles: AuthRole[]): ProjectDefinitionContainer {
  const pluginStore = {
    implementations: {
      [authConfigSpec.name]: {
        getAuthRoles: () => roles,
      },
    },
    getPluginSpec: (spec: { name: string }): unknown => {
      const impl = pluginStore.implementations[spec.name];
      if (!impl) {
        throw new Error(`No implementation for ${spec.name}`);
      }
      return impl;
    },
    getPluginSpecOptional: (spec: { name: string }): unknown =>
      pluginStore.implementations[spec.name],
  } as unknown as PluginImplementationStore;

  return {
    pluginStore,
    definition: {},
  } as unknown as ProjectDefinitionContainer;
}

describe('validateAuthorizerExpression', () => {
  const defaultModelContext = createModelValidationContext({
    name: 'Post',
    fields: [{ name: 'id' }, { name: 'authorId' }, { name: 'title' }],
  });

  const defaultContainer = createMockContainer([
    { id: '1', name: 'admin', comment: 'Admin role', builtIn: false },
    { id: '2', name: 'editor', comment: 'Editor role', builtIn: false },
  ]);

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
        defaultContainer,
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
        defaultContainer,
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
        defaultContainer,
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
        defaultContainer,
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
        defaultContainer,
      );

      expect(warnings).toEqual([]);
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
        defaultContainer,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("'superuser'");
      expect(warnings[0].message).toContain('not defined');
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
        defaultContainer,
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
        defaultContainer,
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
