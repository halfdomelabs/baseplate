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
});
