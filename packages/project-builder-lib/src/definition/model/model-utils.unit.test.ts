import { describe, expect, it } from 'vitest';

import type { ProjectDefinition } from '#src/schema/index.js';

import { ModelUtils } from './model-utils.js';

const { isFieldSafeToFilter, getModelIdsRequiringOrderByInput } = ModelUtils;

describe('isFieldSafeToFilter', () => {
  it('is safe when the field is unrestricted, regardless of the query', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: [], instanceRoles: [] },
        { globalRoles: ['admin'], instanceRoles: ['owner'] },
      ),
    ).toBe(true);
  });

  it('is safe when both the field and query are unrestricted', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: [], instanceRoles: [] },
        { globalRoles: [], instanceRoles: [] },
      ),
    ).toBe(true);
  });

  it('is unsafe when the field is restricted but the query is unrestricted', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin'], instanceRoles: [] },
        { globalRoles: [], instanceRoles: [] },
      ),
    ).toBe(false);
  });

  it('is unsafe when the field has fewer roles than the query (a caller who can query cannot read the field)', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin'], instanceRoles: [] },
        { globalRoles: ['admin', 'editor'], instanceRoles: [] },
      ),
    ).toBe(false);
  });

  it('is safe when the field and query roles are identical', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin'], instanceRoles: ['owner'] },
        { globalRoles: ['admin'], instanceRoles: ['owner'] },
      ),
    ).toBe(true);
  });

  it('is safe when the field has a superset of the query roles', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin', 'support'], instanceRoles: [] },
        { globalRoles: ['admin'], instanceRoles: [] },
      ),
    ).toBe(true);
  });

  it('is unsafe when instanceRoles diverge even if globalRoles match', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin'], instanceRoles: ['owner'] },
        { globalRoles: ['admin'], instanceRoles: ['owner', 'editor'] },
      ),
    ).toBe(false);
  });
});

/**
 * Builds a two-model project mirroring the real shape: `TodoList.owner`
 * targets `User` and carries foreignId `rel-todolists`, surfaced on `User` as
 * the `todoLists` foreign relation. The `orderable` flag lives on `User`'s
 * entry, but the OrderByInput type must be generated on `TodoList` — the
 * model whose rows get sorted.
 */
function projectWith({
  orderable,
  userObjectTypeEnabled = true,
}: {
  orderable: boolean;
  userObjectTypeEnabled?: boolean;
}): ProjectDefinition {
  return {
    models: [
      {
        id: 'model-todolist',
        model: {
          relations: [{ foreignId: 'rel-todolists', modelRef: 'model-user' }],
        },
        graphql: { objectType: { enabled: true, foreignRelations: [] } },
      },
      {
        id: 'model-user',
        model: { relations: [] },
        graphql: {
          objectType: {
            enabled: userObjectTypeEnabled,
            foreignRelations: [{ ref: 'rel-todolists', orderable }],
          },
        },
      },
    ],
  } as unknown as ProjectDefinition;
}

describe('getModelIdsRequiringOrderByInput', () => {
  it('requires an OrderByInput on the relation target when marked orderable', () => {
    expect(
      getModelIdsRequiringOrderByInput(projectWith({ orderable: true })),
    ).toEqual(new Set(['model-todolist']));
  });

  it('requires nothing when the relation is not orderable', () => {
    expect(
      getModelIdsRequiringOrderByInput(projectWith({ orderable: false })),
    ).toEqual(new Set());
  });

  it('ignores orderable relations on a model whose object type is disabled', () => {
    expect(
      getModelIdsRequiringOrderByInput(
        projectWith({ orderable: true, userObjectTypeEnabled: false }),
      ),
    ).toEqual(new Set());
  });

  it('requires nothing for a project with no models', () => {
    expect(
      getModelIdsRequiringOrderByInput({
        models: [],
      } as unknown as ProjectDefinition),
    ).toEqual(new Set());
  });
});
