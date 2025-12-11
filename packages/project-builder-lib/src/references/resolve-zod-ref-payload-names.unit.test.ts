import { describe, expect, it } from 'vitest';

import type { ExtractDefinitionRefsPayload } from './extract-definition-refs.js';

import { resolveZodRefPayloadNames } from './resolve-zod-ref-payload-names.js';
import { createEntityType } from './types.js';

describe('resolveZodRefPayloadNames', () => {
  it('should resolve simple entity names without dependencies', () => {
    const entityType = createEntityType('test');
    const payload: ExtractDefinitionRefsPayload<unknown> = {
      data: {},
      references: [],
      entitiesWithNameResolver: [
        {
          id: 'test-1',
          type: entityType,
          path: ['test'],
          idPath: ['id'],
          nameResolver: {
            resolveName: () => 'Test Entity',
          },
        },
      ],
    };

    const resolved = resolveZodRefPayloadNames(payload);
    expect(resolved.entities).toHaveLength(1);
    expect(resolved.entities[0]).toEqual({
      id: 'test-1',
      type: entityType,
      path: ['test'],
      idPath: ['id'],
      name: 'Test Entity',
    });
  });

  it('should resolve entity names with dependencies in correct order', () => {
    const entityType = createEntityType('test');
    const payload: ExtractDefinitionRefsPayload<unknown> = {
      data: {},
      references: [],
      entitiesWithNameResolver: [
        {
          id: 'child-1',
          type: entityType,
          path: ['child'],
          idPath: ['id'],
          nameResolver: {
            idsToResolve: { parentId: 'parent-1' },
            resolveName: ({ parentId }) => `Child of ${parentId as string}`,
          },
        },
        {
          id: 'parent-1',
          type: entityType,
          path: ['parent'],
          idPath: ['id'],
          nameResolver: {
            resolveName: () => 'Parent Entity',
          },
        },
      ],
    };

    const resolved = resolveZodRefPayloadNames(payload);
    expect(resolved.entities).toHaveLength(2);
    expect(resolved.entities.find((e) => e.id === 'parent-1')?.name).toBe(
      'Parent Entity',
    );
    expect(resolved.entities.find((e) => e.id === 'child-1')?.name).toBe(
      'Child of Parent Entity',
    );
  });

  it('should handle array dependencies', () => {
    const entityType = createEntityType('test');
    const payload: ExtractDefinitionRefsPayload<unknown> = {
      data: {},
      references: [],
      entitiesWithNameResolver: [
        {
          id: 'collection-1',
          type: entityType,
          path: ['collection'],
          idPath: ['id'],
          nameResolver: {
            idsToResolve: { itemIds: ['item-1', 'item-2'] },
            resolveName: ({ itemIds }) =>
              `Collection of ${(itemIds as string[]).join(' and ')}`,
          },
        },
        {
          id: 'item-1',
          type: entityType,
          path: ['items', 0],
          idPath: ['id'],
          nameResolver: {
            resolveName: () => 'Item One',
          },
        },
        {
          id: 'item-2',
          type: entityType,
          path: ['items', 1],
          idPath: ['id'],
          nameResolver: {
            resolveName: () => 'Item Two',
          },
        },
      ],
    };

    const resolved = resolveZodRefPayloadNames(payload);
    expect(resolved.entities).toHaveLength(3);
    expect(resolved.entities.find((e) => e.id === 'collection-1')?.name).toBe(
      'Collection of Item One and Item Two',
    );
  });

  it('should throw error for unresolvable dependencies', () => {
    const entityType = createEntityType('test');
    const payload: ExtractDefinitionRefsPayload<unknown> = {
      data: {},
      references: [],
      entitiesWithNameResolver: [
        {
          id: 'child-1',
          type: entityType,
          path: ['child'],
          idPath: ['id'],
          nameResolver: {
            idsToResolve: { parentId: 'non-existent' },
            resolveName: ({ parentId }) => `Child of ${parentId as string}`,
          },
        },
      ],
    };

    expect(() => resolveZodRefPayloadNames(payload)).toThrow(
      'Could not resolve entity name for id: non-existent',
    );
  });

  it('should allow invalid references when allowInvalidReferences is true', () => {
    const entityType = createEntityType('test');
    const payload: ExtractDefinitionRefsPayload<unknown> = {
      data: {},
      references: [],
      entitiesWithNameResolver: [
        {
          id: 'child-1',
          type: entityType,
          path: ['child'],
          idPath: ['id'],
          nameResolver: {
            idsToResolve: { parentId: 'non-existent' },
            resolveName: ({ parentId }) => `Child of ${parentId as string}`,
          },
        },
      ],
    };

    const resolved = resolveZodRefPayloadNames(payload, {
      allowInvalidReferences: true,
    });
    expect(resolved.entities).toHaveLength(1);
    expect(resolved.entities[0].name).toBe('Child of non-existent');
  });

  it('should skip reference name resolution when skipReferenceNameResolution is true', () => {
    const entityType = createEntityType('test');
    const payload: ExtractDefinitionRefsPayload<unknown> = {
      data: {},
      references: [],
      entitiesWithNameResolver: [
        {
          id: 'child-1',
          type: entityType,
          path: ['child'],
          idPath: ['id'],
          nameResolver: {
            idsToResolve: { parentId: 'parent-1' },
            resolveName: ({ parentId }) => `Child of ${parentId as string}`,
          },
        },
      ],
    };

    const resolved = resolveZodRefPayloadNames(payload, {
      skipReferenceNameResolution: true,
    });
    expect(resolved.entities).toHaveLength(1);
    expect(resolved.entities[0].name).toBe('Child of parent-1');
  });

  it('should preserve references in the output', () => {
    const entityType = createEntityType('test');
    const references = [
      {
        type: entityType,
        path: ['ref'],
        onDelete: 'RESTRICT' as const,
      },
    ];
    const payload: ExtractDefinitionRefsPayload<unknown> = {
      data: {},
      references,
      entitiesWithNameResolver: [],
    };

    const resolved = resolveZodRefPayloadNames(payload);
    expect(resolved.references).toBe(references);
  });

  it('should preserve input data in the output', () => {
    const data = { test: 'value' };
    const payload: ExtractDefinitionRefsPayload<typeof data> = {
      data,
      references: [],
      entitiesWithNameResolver: [],
    };

    const resolved = resolveZodRefPayloadNames(payload);
    expect(resolved.data).toBe(data);
  });
});
