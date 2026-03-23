import { describe, expect, it } from 'vitest';

import type { RefExpressionDependency } from '#src/references/expression-types.js';
import type { ModelConfigInput } from '#src/schema/models/models.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { modelAuthorizerRoleEntityType } from '#src/schema/models/authorizer/types.js';
import {
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/types.js';
import { createTestModel } from '#src/testing/definition-helpers.test-helper.js';
import { createTestProjectDefinition } from '#src/testing/project-definition-container.test-helper.js';

import { parseAuthorizerExpression } from './authorizer-expression-acorn-parser.js';
import { AuthorizerExpressionParser } from './authorizer-expression-parser.js';

/**
 * Build a definition with models for testing getReferencedEntities.
 * Returns properly-typed objects from createTestModel/createTestProjectDefinition.
 */
function buildDefinition(
  mainModelInput: TestModelOverrides,
  otherModelInputs: TestModelOverrides[] = [],
): {
  definition: ProjectDefinition;
  resolvedSlots: { model: (string | number)[] };
} {
  const mainModel = createTestModel({
    id: 'model:main',
    name: 'Main',
    ...mainModelInput,
  } as Partial<ModelConfigInput>);

  const otherModels = otherModelInputs.map((input) =>
    createTestModel(input as Partial<ModelConfigInput>),
  );

  const definition = createTestProjectDefinition({
    models: [mainModel, ...otherModels],
  });

  return {
    definition,
    resolvedSlots: { model: ['models', 0] },
  };
}

function getReferencedEntities(
  expression: string,
  mainModelInput: TestModelOverrides,
  otherModelInputs?: TestModelOverrides[],
): RefExpressionDependency[] {
  const parser = new AuthorizerExpressionParser();
  const info = parseAuthorizerExpression(expression);
  const { definition, resolvedSlots } = buildDefinition(
    mainModelInput,
    otherModelInputs,
  );
  return parser.getReferencedEntities(
    expression,
    { success: true, value: info },
    definition,
    resolvedSlots,
  );
}

/**
 * Test-only model input that allows partial model sub-fields.
 * createTestModel fills in all required defaults at runtime.
 */
// oxlint-disable-next-line typescript/no-explicit-any
type TestModelInput = Record<string, any>;

/** Loose override type for test model creation — cast to ModelConfigInput at call site. */
interface TestModelOverrides {
  id?: string;
  name?: string;
  model?: TestModelInput;
  authorizer?: TestModelInput;
  [key: string]: unknown;
}

/** Helper: create model input with extra fields (default id field is kept by createTestModel). */
function modelWithFields(
  extraFields: { id: string; name: string }[],
): TestModelInput {
  return {
    fields: extraFields.map((f) => ({
      ...f,
      type: 'string' as const,
      isOptional: false,
      options: { default: '' },
    })),
  };
}

/** Helper: create model input with relations. */
function modelWithRelations(
  relations: { id: string; name: string; modelRef: string }[],
): TestModelInput {
  return {
    relations: relations.map((r) => ({
      ...r,
      foreignRelationName: 'backRef',
      references: [],
    })),
  };
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
        model: modelWithFields([
          { id: 'model-scalar-field:title', name: 'title' },
        ]),
      });
      expect(deps).toEqual([
        {
          entityType: modelScalarFieldEntityType,
          entityId: 'model-scalar-field:title',
          start: 6,
          end: 11,
        },
      ]);
    });

    it('should resolve fields on both sides of a comparison', () => {
      const deps = getReferencedEntities('model.authorId === model.creatorId', {
        model: modelWithFields([
          { id: 'model-scalar-field:author', name: 'authorId' },
          { id: 'model-scalar-field:creator', name: 'creatorId' },
        ]),
      });
      expect(deps).toHaveLength(2);
      expect(deps[0].entityId).toBe('model-scalar-field:author');
      expect(deps[1].entityId).toBe('model-scalar-field:creator');
    });

    it('should skip unknown fields', () => {
      const deps = getReferencedEntities('model.unknown === userId', {});
      expect(deps).toEqual([]);
    });
  });

  describe('relation references', () => {
    it('should resolve relation in nested hasRole', () => {
      const deps = getReferencedEntities(
        "hasRole(model.todoList, 'owner')",
        {
          model: modelWithRelations([
            {
              id: 'model-local-relation:todoList',
              name: 'todoList',
              modelRef: 'model:todo',
            },
          ]),
        },
        [
          {
            id: 'model:todo',
            name: 'Todo',
            authorizer: {
              roles: [
                {
                  id: 'model-authorizer-role:owner',
                  name: 'owner',
                  expression: 'model.id === userId',
                },
              ],
            },
          },
        ],
      );
      expect(deps).toHaveLength(2);
      expect(deps[0].entityId).toBe('model-local-relation:todoList');
      expect(deps[0].entityType).toBe(modelLocalRelationEntityType);
      expect(deps[1].entityId).toBe('model-authorizer-role:owner');
      expect(deps[1].entityType).toBe(modelAuthorizerRoleEntityType);
    });

    it('should resolve relation in exists filter', () => {
      const deps = getReferencedEntities(
        'exists(model.members, { memberId: userId })',
        {
          model: modelWithRelations([
            {
              id: 'model-local-relation:members',
              name: 'members',
              modelRef: 'model:member',
            },
          ]),
        },
        [
          {
            id: 'model:member',
            name: 'Member',
            model: modelWithFields([
              { id: 'model-scalar-field:memberId', name: 'memberId' },
            ]),
          },
        ],
      );
      expect(deps).toHaveLength(2);
      expect(deps[0].entityId).toBe('model-local-relation:members');
      expect(deps[1].entityId).toBe('model-scalar-field:memberId');
    });
  });

  describe('end-to-end rename via generic orchestrator', () => {
    it('should rename a model field', () => {
      const expression = 'model.title === userId';
      const deps = getReferencedEntities(expression, {
        model: modelWithFields([
          { id: 'model-scalar-field:title', name: 'title' },
        ]),
      });
      const result = applyRenames(
        expression,
        deps,
        new Map([['model-scalar-field:title', 'heading']]),
      );
      expect(result).toBe('model.heading === userId');
    });

    it('should rename a relation in nested hasRole', () => {
      const expression = "hasRole(model.todoList, 'owner')";
      const deps = getReferencedEntities(
        expression,
        {
          model: modelWithRelations([
            {
              id: 'model-local-relation:todoList',
              name: 'todoList',
              modelRef: 'model:todo',
            },
          ]),
        },
        [
          {
            id: 'model:todo',
            name: 'Todo',
            authorizer: {
              roles: [
                {
                  id: 'model-authorizer-role:owner',
                  name: 'owner',
                  expression: 'model.id === userId',
                },
              ],
            },
          },
        ],
      );
      const result = applyRenames(
        expression,
        deps,
        new Map([['model-local-relation:todoList', 'list']]),
      );
      expect(result).toBe("hasRole(model.list, 'owner')");
    });

    it('should rename a foreign authorizer role', () => {
      const expression = "hasRole(model.todoList, 'owner')";
      const deps = getReferencedEntities(
        expression,
        {
          model: modelWithRelations([
            {
              id: 'model-local-relation:todoList',
              name: 'todoList',
              modelRef: 'model:todo',
            },
          ]),
        },
        [
          {
            id: 'model:todo',
            name: 'Todo',
            authorizer: {
              roles: [
                {
                  id: 'model-authorizer-role:owner',
                  name: 'owner',
                  expression: 'model.id === userId',
                },
              ],
            },
          },
        ],
      );
      const result = applyRenames(
        expression,
        deps,
        new Map([['model-authorizer-role:owner', 'admin']]),
      );
      expect(result).toBe("hasRole(model.todoList, 'admin')");
    });

    it('should rename relation and foreign role together', () => {
      const expression = "hasRole(model.todoList, 'owner')";
      const deps = getReferencedEntities(
        expression,
        {
          model: modelWithRelations([
            {
              id: 'model-local-relation:todoList',
              name: 'todoList',
              modelRef: 'model:todo',
            },
          ]),
        },
        [
          {
            id: 'model:todo',
            name: 'Todo',
            authorizer: {
              roles: [
                {
                  id: 'model-authorizer-role:owner',
                  name: 'owner',
                  expression: 'model.id === userId',
                },
              ],
            },
          },
        ],
      );
      const result = applyRenames(
        expression,
        deps,
        new Map([
          ['model-local-relation:todoList', 'list'],
          ['model-authorizer-role:owner', 'admin'],
        ]),
      );
      expect(result).toBe("hasRole(model.list, 'admin')");
    });

    it('should rename foreign field in exists condition', () => {
      const expression = 'exists(model.members, { userName: userId })';
      const deps = getReferencedEntities(
        expression,
        {
          model: modelWithRelations([
            {
              id: 'model-local-relation:members',
              name: 'members',
              modelRef: 'model:member',
            },
          ]),
        },
        [
          {
            id: 'model:member',
            name: 'Member',
            model: modelWithFields([
              { id: 'model-scalar-field:userName', name: 'userName' },
            ]),
          },
        ],
      );
      const result = applyRenames(
        expression,
        deps,
        new Map([['model-scalar-field:userName', 'memberName']]),
      );
      expect(result).toBe('exists(model.members, { memberName: userId })');
    });

    it('should not rename when no entities match', () => {
      const expression = 'model.id === userId';
      const deps = getReferencedEntities(expression, {});
      // The default id field from createTestModel should be resolved
      expect(deps).toHaveLength(1);

      const result = applyRenames(
        expression,
        deps,
        new Map([['model-scalar-field:other', 'something']]),
      );
      expect(result).toBe(expression);
    });
  });
});
