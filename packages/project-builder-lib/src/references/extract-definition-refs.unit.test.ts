import { describe, expect, it } from 'vitest';

import type { ZodRefContext } from './extract-definition-refs.js';

import {
  extractDefinitionRefs,
  extractDefinitionRefsRecursive,
} from './extract-definition-refs.js';
import {
  DefinitionReferenceMarker,
  REF_ANNOTATIONS_MARKER_SYMBOL,
} from './markers.js';
import { DefinitionEntityType } from './types.js';

// Create simple entity types for testing
const testEntityType = new DefinitionEntityType('test', 'test');
const testRefEntityType = new DefinitionEntityType('testref', 'testref');

describe('extractDefinitionRefs - Core Logic', () => {
  describe('extractDefinitionRefsRecursive', () => {
    it('should extract reference markers and return clean values', () => {
      const context: ZodRefContext = {
        context: { pathMap: new Map() },
        references: [],
        entitiesWithNameResolver: [],
      };

      const referenceMarker = new DefinitionReferenceMarker('testref:test-id', {
        type: testRefEntityType,
        onDelete: 'RESTRICT',
      });

      const result = extractDefinitionRefsRecursive(referenceMarker, context, [
        'field',
      ]);

      expect(result).toBe('testref:test-id');
      expect(context.references).toHaveLength(1);
      expect(context.references[0]).toEqual({
        type: testRefEntityType,
        path: ['field'],
        onDelete: 'RESTRICT',
        parentPath: undefined,
      });
    });

    it('should extract entity annotations and return clean objects', () => {
      const context: ZodRefContext = {
        context: { pathMap: new Map() },
        references: [],
        entitiesWithNameResolver: [],
      };

      const inputWithAnnotations = {
        id: 'test:test-id',
        name: 'Test Entity',
        [REF_ANNOTATIONS_MARKER_SYMBOL]: {
          entities: [
            {
              type: testEntityType,
              getNameResolver: () => 'Test Entity',
            },
          ],
          references: [],
          contextPaths: [],
        },
      };

      const result = extractDefinitionRefsRecursive(
        inputWithAnnotations,
        context,
        ['entity'],
      );

      expect(result).toEqual({
        id: 'test:test-id',
        name: 'Test Entity',
      });
      expect(context.entitiesWithNameResolver).toHaveLength(1);
      expect(context.entitiesWithNameResolver[0]).toMatchObject({
        id: 'test:test-id',
        type: testEntityType,
        path: ['entity'],
        idPath: ['entity', 'id'],
      });
    });

    it('should handle nested objects recursively', () => {
      const context: ZodRefContext = {
        context: { pathMap: new Map() },
        references: [],
        entitiesWithNameResolver: [],
      };

      const nestedInput = {
        entity: {
          id: 'test:entity-id',
          name: 'Test Entity',
          fields: [
            {
              name: 'ref_field',
              ref: new DefinitionReferenceMarker('testref:ref-id', {
                type: testRefEntityType,
                onDelete: 'SET_NULL',
              }),
            },
          ],
        },
      };

      const result = extractDefinitionRefsRecursive(nestedInput, context, []);

      expect(result).toEqual({
        entity: {
          id: 'test:entity-id',
          name: 'Test Entity',
          fields: [
            {
              name: 'ref_field',
              ref: 'testref:ref-id',
            },
          ],
        },
      });
      expect(context.references).toHaveLength(1);
      expect(context.references[0]).toEqual({
        type: testRefEntityType,
        path: ['entity', 'fields', 0, 'ref'],
        onDelete: 'SET_NULL',
        parentPath: undefined,
      });
    });

    it('should handle arrays correctly', () => {
      const context: ZodRefContext = {
        context: { pathMap: new Map() },
        references: [],
        entitiesWithNameResolver: [],
      };

      const arrayInput = [
        new DefinitionReferenceMarker('testref:ref1', {
          type: testRefEntityType,
          onDelete: 'RESTRICT',
        }),
        new DefinitionReferenceMarker('testref:ref2', {
          type: testRefEntityType,
          onDelete: 'SET_NULL',
        }),
      ];

      const result = extractDefinitionRefsRecursive(arrayInput, context, [
        'refs',
      ]);

      expect(result).toEqual(['testref:ref1', 'testref:ref2']);
      expect(context.references).toHaveLength(2);
      expect(context.references[0].path).toEqual(['refs', 0]);
      expect(context.references[1].path).toEqual(['refs', 1]);
    });

    it('should return primitive values unchanged', () => {
      const context: ZodRefContext = {
        context: { pathMap: new Map() },
        references: [],
        entitiesWithNameResolver: [],
      };

      expect(extractDefinitionRefsRecursive('string', context, [])).toBe(
        'string',
      );
      expect(extractDefinitionRefsRecursive(42, context, [])).toBe(42);
      expect(extractDefinitionRefsRecursive(true, context, [])).toBe(true);
      expect(extractDefinitionRefsRecursive(null, context, [])).toBe(null);
      expect(extractDefinitionRefsRecursive(undefined, context, [])).toBe(
        undefined,
      );
    });
  });

  describe('extractDefinitionRefs', () => {
    it('should extract all markers from a simple object', () => {
      const simpleInput = {
        entity: {
          id: 'test:entity1',
          name: 'Test Entity',
          [REF_ANNOTATIONS_MARKER_SYMBOL]: {
            entities: [
              {
                type: testEntityType,
                getNameResolver: () => 'Test Entity',
              },
            ],
            references: [],
            contextPaths: [],
          },
          ref: new DefinitionReferenceMarker('testref:target', {
            type: testRefEntityType,
            onDelete: 'SET_NULL',
          }),
        },
      };

      const result = extractDefinitionRefs(simpleInput);

      expect(result.data).toEqual({
        entity: {
          id: 'test:entity1',
          name: 'Test Entity',
          ref: 'testref:target',
        },
      });

      expect(result.entitiesWithNameResolver).toHaveLength(1);
      expect(result.references).toHaveLength(1);
      expect(result.references[0]).toEqual({
        type: testRefEntityType,
        path: ['entity', 'ref'],
        onDelete: 'SET_NULL',
        parentPath: undefined,
      });
    });

    it('should handle empty input', () => {
      const result = extractDefinitionRefs({});
      expect(result.data).toEqual({});
      expect(result.entitiesWithNameResolver).toHaveLength(0);
      expect(result.references).toHaveLength(0);
    });

    it('should handle input with no markers', () => {
      const plainInput = {
        id: 'test',
        name: 'Plain Object',
        nested: {
          value: 42,
          array: [1, 2, 3],
        },
      };

      const result = extractDefinitionRefs(plainInput);
      expect(result.data).toEqual(plainInput);
      expect(result.entitiesWithNameResolver).toHaveLength(0);
      expect(result.references).toHaveLength(0);
    });
  });

  describe('Context Paths', () => {
    const modelType = new DefinitionEntityType('model', 'model');
    const fieldType = new DefinitionEntityType('field', 'field', modelType);

    it('should handle references with context-based parent paths', () => {
      const context: ZodRefContext = {
        context: {
          pathMap: new Map([
            ['model', { path: ['models', 0], type: modelType }],
          ]),
        },
        references: [],
        entitiesWithNameResolver: [],
      };

      const referenceWithContextParent = new DefinitionReferenceMarker(
        'field:target-field',
        {
          type: fieldType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'model' },
        },
      );

      const result = extractDefinitionRefsRecursive(
        referenceWithContextParent,
        context,
        ['field', 'ref'],
      );

      expect(result).toBe('field:target-field');
      expect(context.references).toHaveLength(1);
      expect(context.references[0]).toEqual({
        type: fieldType,
        path: ['field', 'ref'],
        onDelete: 'RESTRICT',
        parentPath: ['models', 0],
      });
    });

    it('should handle nested context paths with foreign models', () => {
      const context: ZodRefContext = {
        context: {
          pathMap: new Map([
            ['model', { path: ['models', 0], type: modelType }],
            ['foreignModel', { path: ['models', 1], type: modelType }],
          ]),
        },
        references: [],
        entitiesWithNameResolver: [],
      };

      const nestedInput = {
        relation: {
          modelRef: new DefinitionReferenceMarker('model:foreign-model', {
            type: modelType,
            onDelete: 'RESTRICT',
          }),
          references: [
            {
              localRef: new DefinitionReferenceMarker('field:local-field', {
                type: fieldType,
                onDelete: 'RESTRICT',
                parentPath: { context: 'model' },
              }),
              foreignRef: new DefinitionReferenceMarker('field:foreign-field', {
                type: fieldType,
                onDelete: 'RESTRICT',
                parentPath: { context: 'foreignModel' },
              }),
            },
          ],
        },
      };

      const result = extractDefinitionRefsRecursive(nestedInput, context, []);

      expect(result).toEqual({
        relation: {
          modelRef: 'model:foreign-model',
          references: [
            {
              localRef: 'field:local-field',
              foreignRef: 'field:foreign-field',
            },
          ],
        },
      });

      expect(context.references).toHaveLength(3);

      // Check modelRef reference
      const modelRefRef = context.references.find(
        (ref) => ref.path.join('.') === 'relation.modelRef',
      );
      expect(modelRefRef).toEqual({
        type: modelType,
        path: ['relation', 'modelRef'],
        onDelete: 'RESTRICT',
        parentPath: undefined,
      });

      // Check localRef reference (should use 'model' context)
      const localRefRef = context.references.find(
        (ref) => ref.path.join('.') === 'relation.references.0.localRef',
      );
      expect(localRefRef).toEqual({
        type: fieldType,
        path: ['relation', 'references', 0, 'localRef'],
        onDelete: 'RESTRICT',
        parentPath: ['models', 0],
      });

      // Check foreignRef reference (should use 'foreignModel' context)
      const foreignRefRef = context.references.find(
        (ref) => ref.path.join('.') === 'relation.references.0.foreignRef',
      );
      expect(foreignRefRef).toEqual({
        type: fieldType,
        path: ['relation', 'references', 0, 'foreignRef'],
        onDelete: 'RESTRICT',
        parentPath: ['models', 1],
      });
    });

    it('should handle multiple context paths with overlapping names', () => {
      const context: ZodRefContext = {
        context: {
          pathMap: new Map([
            ['model', { path: ['models', 0], type: modelType }],
            ['foreignModel', { path: ['models', 1], type: modelType }],
            ['thirdModel', { path: ['models', 2], type: modelType }],
          ]),
        },
        references: [],
        entitiesWithNameResolver: [],
      };

      const multiContextInput = {
        complexRef: new DefinitionReferenceMarker('field:complex-field', {
          type: fieldType,
          onDelete: 'SET_NULL',
          parentPath: { context: 'thirdModel' },
        }),
      };

      const result = extractDefinitionRefsRecursive(
        multiContextInput,
        context,
        ['complex'],
      );

      expect(result).toEqual({
        complexRef: 'field:complex-field',
      });

      expect(context.references).toHaveLength(1);
      expect(context.references[0]).toEqual({
        type: fieldType,
        path: ['complex', 'complexRef'],
        onDelete: 'SET_NULL',
        parentPath: ['models', 2],
      });
    });

    it('should handle context paths that do not exist in pathMap and fail gracefully', () => {
      const context: ZodRefContext = {
        context: {
          pathMap: new Map([
            ['model', { path: ['models', 0], type: modelType }],
          ]),
        },
        references: [],
        entitiesWithNameResolver: [],
      };

      const referenceWithMissingContext = new DefinitionReferenceMarker(
        'field:missing-context-field',
        {
          type: fieldType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'nonExistentContext' },
        },
      );

      expect(() =>
        extractDefinitionRefsRecursive(referenceWithMissingContext, context, [
          'field',
          'ref',
        ]),
      ).toThrow('Could not find context for nonExistentContext from field.ref');
    });

    it('should handle entities with context-based parent paths', () => {
      const context: ZodRefContext = {
        context: {
          pathMap: new Map([
            ['model', { path: ['models', 0], type: modelType }],
          ]),
        },
        references: [],
        entitiesWithNameResolver: [],
      };

      const entityWithContextParent = {
        id: 'field:entity1',
        name: 'contextField',
        [REF_ANNOTATIONS_MARKER_SYMBOL]: {
          entities: [
            {
              type: fieldType,
              getNameResolver: () => 'contextField',
              parentPath: { context: 'model' },
            },
          ],
          references: [],
          contextPaths: [],
        },
      };

      const result = extractDefinitionRefsRecursive(
        entityWithContextParent,
        context,
        ['entity'],
      );

      expect(result).toEqual({
        id: 'field:entity1',
        name: 'contextField',
      });

      expect(context.entitiesWithNameResolver).toHaveLength(1);
      expect(context.entitiesWithNameResolver[0]).toMatchObject({
        id: 'field:entity1',
        type: fieldType,
        path: ['entity'],
        idPath: ['entity', 'id'],
        parentPath: ['models', 0],
      });
    });

    it('should validate entity type consistency when resolving context paths', () => {
      const context: ZodRefContext = {
        context: {
          pathMap: new Map([
            ['model', { path: ['models', 0], type: modelType }],
          ]),
        },
        references: [],
        entitiesWithNameResolver: [],
      };

      // Try to use a context with wrong entity type expectation
      const referenceWithWrongType = new DefinitionReferenceMarker(
        'field:wrong-type-field',
        {
          type: fieldType,
          onDelete: 'RESTRICT',
          // fieldType expects modelType as parent, but we're resolving to fieldType context
          parentPath: { context: 'model' },
        },
      );

      // This should work because fieldType.parentType is modelType,
      // and the context 'model' has modelType
      const result = extractDefinitionRefsRecursive(
        referenceWithWrongType,
        context,
        ['field', 'ref'],
      );

      expect(result).toBe('field:wrong-type-field');
      expect(context.references).toHaveLength(1);
      expect(context.references[0]).toEqual({
        type: fieldType,
        path: ['field', 'ref'],
        onDelete: 'RESTRICT',
        parentPath: ['models', 0],
      });
    });
  });
});
