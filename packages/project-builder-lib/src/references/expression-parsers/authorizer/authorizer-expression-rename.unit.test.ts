import { describe, expect, it } from 'vitest';

import type { RefExpressionDependency } from '#src/references/expression-types.js';

import { modelAuthorizerRoleEntityType } from '#src/schema/models/authorizer/types.js';
import { modelScalarFieldEntityType } from '#src/schema/models/types.js';

import { parseAuthorizerExpression } from './authorizer-expression-acorn-parser.js';
import { AuthorizerExpressionParser } from './authorizer-expression-parser.js';

/**
 * Build a minimal definition with one model for testing getReferencedEntities.
 */
function buildDefinition(
  model: {
    fields?: { id: string; name: string }[];
    relations?: {
      id: string;
      name: string;
      modelRef: string;
    }[];
  },
  otherModels?: {
    id: string;
    name: string;
    fields?: { id: string; name: string }[];
    authorizer?: { roles?: { id: string; name: string }[] };
  }[],
): { definition: unknown; resolvedSlots: { model: (string | number)[] } } {
  const mainModel = {
    id: 'model:main',
    name: 'Main',
    model: {
      fields: model.fields ?? [],
      relations: model.relations ?? [],
    },
    authorizer: { roles: [] },
  };

  const models = [
    mainModel,
    ...(otherModels ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      model: { fields: m.fields ?? [], relations: [] },
      authorizer: m.authorizer ?? { roles: [] },
    })),
  ];

  return {
    definition: { models },
    resolvedSlots: { model: ['models', 0] },
  };
}

function getReferencedEntities(
  expression: string,
  model: Parameters<typeof buildDefinition>[0],
  otherModels?: Parameters<typeof buildDefinition>[1],
): RefExpressionDependency[] {
  const parser = new AuthorizerExpressionParser();
  const info = parseAuthorizerExpression(expression);
  const { definition, resolvedSlots } = buildDefinition(model, otherModels);
  return parser.getReferencedEntities(
    expression,
    { success: true, value: info },
    definition,
    resolvedSlots,
  );
}

/**
 * Helper to apply renames using getReferencedEntities output.
 * Mimics the generic orchestrator logic.
 */
function applyRenames(
  expression: string,
  deps: RefExpressionDependency[],
  renames: Map<string, string>,
): string {
  const replacements = deps
    .filter((ref) => renames.has(ref.entityId))
    .map((ref) => ({
      start: ref.start,
      end: ref.end,
      newValue: renames.get(ref.entityId) ?? '',
    }))
    .toSorted((a, b) => b.start - a.start);

  let result = expression;
  for (const { start, end, newValue } of replacements) {
    result = result.slice(0, start) + newValue + result.slice(end);
  }
  return result;
}

describe('AuthorizerExpressionParser.getReferencedEntities', () => {
  describe('model field references', () => {
    it('should resolve model.field to field entity ID', () => {
      const deps = getReferencedEntities('model.title === userId', {
        fields: [{ id: 'field:title', name: 'title' }],
      });
      expect(deps).toEqual([
        {
          entityType: modelScalarFieldEntityType,
          entityId: 'field:title',
          start: 6,
          end: 11,
        },
      ]);
    });

    it('should resolve fields on both sides of a comparison', () => {
      const deps = getReferencedEntities('model.authorId === model.creatorId', {
        fields: [
          { id: 'field:author', name: 'authorId' },
          { id: 'field:creator', name: 'creatorId' },
        ],
      });
      expect(deps).toHaveLength(2);
      expect(deps[0].entityId).toBe('field:author');
      expect(deps[1].entityId).toBe('field:creator');
    });

    it('should skip unknown fields', () => {
      const deps = getReferencedEntities('model.unknown === userId', {
        fields: [{ id: 'field:title', name: 'title' }],
      });
      expect(deps).toEqual([]);
    });
  });

  describe('relation references', () => {
    it('should resolve relation in nested hasRole', () => {
      const deps = getReferencedEntities(
        "hasRole(model.todoList, 'owner')",
        {
          relations: [
            {
              id: 'rel:todoList',
              name: 'todoList',
              modelRef: 'model:todo',
            },
          ],
        },
        [
          {
            id: 'model:todo',
            name: 'Todo',
            authorizer: {
              roles: [{ id: 'auth-role:owner', name: 'owner' }],
            },
          },
        ],
      );
      // Should have both the relation ref and the foreign role ref
      expect(deps).toHaveLength(2);
      expect(deps[0].entityId).toBe('rel:todoList');
      expect(deps[1].entityId).toBe('auth-role:owner');
      expect(deps[1].entityType).toBe(modelAuthorizerRoleEntityType);
    });

    it('should resolve relation in exists filter', () => {
      const deps = getReferencedEntities(
        'exists(model.members, { memberId: userId })',
        {
          relations: [
            {
              id: 'rel:members',
              name: 'members',
              modelRef: 'model:member',
            },
          ],
        },
        [
          {
            id: 'model:member',
            name: 'Member',
            fields: [{ id: 'field:memberId', name: 'memberId' }],
          },
        ],
      );
      // Relation + foreign field in condition
      expect(deps).toHaveLength(2);
      expect(deps[0].entityId).toBe('rel:members');
      expect(deps[1].entityId).toBe('field:memberId');
    });
  });

  describe('end-to-end rename via generic orchestrator', () => {
    it('should rename a model field', () => {
      const expression = 'model.title === userId';
      const deps = getReferencedEntities(expression, {
        fields: [{ id: 'field:title', name: 'title' }],
      });
      const result = applyRenames(
        expression,
        deps,
        new Map([['field:title', 'heading']]),
      );
      expect(result).toBe('model.heading === userId');
    });

    it('should rename a relation in nested hasRole', () => {
      const expression = "hasRole(model.todoList, 'owner')";
      const deps = getReferencedEntities(
        expression,
        {
          relations: [
            {
              id: 'rel:todoList',
              name: 'todoList',
              modelRef: 'model:todo',
            },
          ],
        },
        [
          {
            id: 'model:todo',
            name: 'Todo',
            authorizer: {
              roles: [{ id: 'auth-role:owner', name: 'owner' }],
            },
          },
        ],
      );
      const result = applyRenames(
        expression,
        deps,
        new Map([['rel:todoList', 'list']]),
      );
      expect(result).toBe("hasRole(model.list, 'owner')");
    });

    it('should rename a foreign authorizer role', () => {
      const expression = "hasRole(model.todoList, 'owner')";
      const deps = getReferencedEntities(
        expression,
        {
          relations: [
            {
              id: 'rel:todoList',
              name: 'todoList',
              modelRef: 'model:todo',
            },
          ],
        },
        [
          {
            id: 'model:todo',
            name: 'Todo',
            authorizer: {
              roles: [{ id: 'auth-role:owner', name: 'owner' }],
            },
          },
        ],
      );
      const result = applyRenames(
        expression,
        deps,
        new Map([['auth-role:owner', 'admin']]),
      );
      expect(result).toBe("hasRole(model.todoList, 'admin')");
    });

    it('should rename relation and foreign role together', () => {
      const expression = "hasRole(model.todoList, 'owner')";
      const deps = getReferencedEntities(
        expression,
        {
          relations: [
            {
              id: 'rel:todoList',
              name: 'todoList',
              modelRef: 'model:todo',
            },
          ],
        },
        [
          {
            id: 'model:todo',
            name: 'Todo',
            authorizer: {
              roles: [{ id: 'auth-role:owner', name: 'owner' }],
            },
          },
        ],
      );
      const result = applyRenames(
        expression,
        deps,
        new Map([
          ['rel:todoList', 'list'],
          ['auth-role:owner', 'admin'],
        ]),
      );
      expect(result).toBe("hasRole(model.list, 'admin')");
    });

    it('should rename foreign field in exists condition', () => {
      const expression = 'exists(model.members, { userName: userId })';
      const deps = getReferencedEntities(
        expression,
        {
          relations: [
            {
              id: 'rel:members',
              name: 'members',
              modelRef: 'model:member',
            },
          ],
        },
        [
          {
            id: 'model:member',
            name: 'Member',
            fields: [{ id: 'field:userName', name: 'userName' }],
          },
        ],
      );
      const result = applyRenames(
        expression,
        deps,
        new Map([['field:userName', 'memberName']]),
      );
      expect(result).toBe('exists(model.members, { memberName: userId })');
    });

    it('should handle complex expression with multiple renames', () => {
      const expression =
        "model.authorId === userId && hasRole(model.todoList, 'owner')";
      const deps = getReferencedEntities(
        expression,
        {
          fields: [{ id: 'field:authorId', name: 'authorId' }],
          relations: [
            {
              id: 'rel:todoList',
              name: 'todoList',
              modelRef: 'model:todo',
            },
          ],
        },
        [
          {
            id: 'model:todo',
            name: 'Todo',
            authorizer: {
              roles: [{ id: 'auth-role:owner', name: 'owner' }],
            },
          },
        ],
      );
      const result = applyRenames(
        expression,
        deps,
        new Map([
          ['field:authorId', 'ownerId'],
          ['rel:todoList', 'list'],
          ['auth-role:owner', 'admin'],
        ]),
      );
      expect(result).toBe(
        "model.ownerId === userId && hasRole(model.list, 'admin')",
      );
    });

    it('should not rename when no entities match', () => {
      const expression = 'model.id === userId';
      const deps = getReferencedEntities(expression, {
        fields: [{ id: 'field:id', name: 'id' }],
      });
      const result = applyRenames(
        expression,
        deps,
        new Map([['field:other', 'something']]),
      );
      expect(result).toBe(expression);
    });
  });
});
