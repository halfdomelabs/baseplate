import { describe, expect, it } from 'vitest';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';

import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '#src/testing/definition-helpers.test-helper.js';
import { createTestProjectDefinitionContainer } from '#src/testing/project-definition-container.test-helper.js';

import { diffDefinition } from './diff-definition.js';

describe('diffDefinition', () => {
  const testFeature = createTestFeature();

  function createBaseContainer(): ProjectDefinitionContainer {
    const idField = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const emailField = createTestScalarField({
      name: 'email',
      type: 'string',
    });
    const userModel = createTestModel({
      name: 'User',
      featureRef: testFeature.name,
      model: {
        fields: [idField, emailField],
        primaryKeyFieldRefs: [idField.name],
      },
    });
    return createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [userModel],
    });
  }

  it('returns no changes when partial def matches current', () => {
    const container = createBaseContainer();

    const diff = diffDefinition(container.schema, container.definition, {});

    expect(diff.hasChanges).toBe(false);
    expect(diff.entries).toHaveLength(0);
  });

  it('detects a new model as added', () => {
    const container = createBaseContainer();

    const diff = diffDefinition(container.schema, container.definition, {
      models: [
        {
          name: 'User',
          featureRef: testFeature.name,
          model: {
            fields: [
              { name: 'id', type: 'uuid', options: { genUuid: true } },
              { name: 'email', type: 'string' },
            ],
            primaryKeyFieldRefs: ['id'],
          },
        },
        {
          name: 'Post',
          featureRef: testFeature.name,
          model: {
            fields: [
              { name: 'id', type: 'uuid', options: { genUuid: true } },
              { name: 'title', type: 'string' },
            ],
            primaryKeyFieldRefs: ['id'],
          },
        },
      ],
    });

    expect(diff.hasChanges).toBe(true);
    const postEntry = diff.entries.find((e) => e.label === 'Model: Post');
    expect(postEntry).toBeDefined();
    expect(postEntry?.type).toBe('added');
    expect(postEntry?.current).toBeUndefined();
    expect(postEntry?.merged).toBeDefined();
    expect(postEntry?.path).toBe('models');
  });

  it('detects an updated model field', () => {
    const container = createBaseContainer();

    const diff = diffDefinition(container.schema, container.definition, {
      models: [
        {
          name: 'User',
          featureRef: testFeature.name,
          model: {
            fields: [
              { name: 'id', type: 'uuid', options: { genUuid: true } },
              { name: 'email', type: 'string', isOptional: true },
            ],
            primaryKeyFieldRefs: ['id'],
          },
        },
      ],
    });

    expect(diff.hasChanges).toBe(true);
    const userEntry = diff.entries.find((e) => e.label === 'Model: User');
    expect(userEntry).toBeDefined();
    expect(userEntry?.type).toBe('updated');
    expect(userEntry?.current).toBeDefined();
    expect(userEntry?.merged).toBeDefined();
  });

  it('ignores entities not named in the partial definition', () => {
    const idField2 = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const postModel = createTestModel({
      name: 'Post',
      featureRef: testFeature.name,
      model: {
        fields: [idField2],
        primaryKeyFieldRefs: [idField2.name],
      },
    });
    const idField = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const userModel = createTestModel({
      name: 'User',
      featureRef: testFeature.name,
      model: {
        fields: [idField],
        primaryKeyFieldRefs: [idField.name],
      },
    });
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [userModel, postModel],
    });

    // Only include User in partial — Post should NOT appear as removed
    const diff = diffDefinition(container.schema, container.definition, {
      models: [
        {
          name: 'User',
          featureRef: testFeature.name,
          model: {
            fields: [{ name: 'id', type: 'uuid', options: { genUuid: true } }],
            primaryKeyFieldRefs: ['id'],
          },
        },
      ],
    });

    expect(diff.hasChanges).toBe(false);
    const postEntry = diff.entries.find((e) => e.label === 'Model: Post');
    expect(postEntry).toBeUndefined();
  });

  it('uses entity type name for labels', () => {
    const container = createBaseContainer();

    const diff = diffDefinition(container.schema, container.definition, {
      models: [
        {
          name: 'User',
          featureRef: testFeature.name,
          model: {
            fields: [
              { name: 'id', type: 'uuid', options: { genUuid: true } },
              { name: 'email', type: 'string', isOptional: true },
            ],
            primaryKeyFieldRefs: ['id'],
          },
        },
      ],
    });

    // The label should use the entity type name ("model" → "Model")
    const entry = diff.entries[0];
    expect(entry.label).toMatch(/^Model: /);
  });

  it('detects changes to non-entity fields', () => {
    const container = createBaseContainer();

    const diff = diffDefinition(container.schema, container.definition, {
      settings: {
        general: {
          name: 'new-project-name',
        },
      },
    });

    expect(diff.hasChanges).toBe(true);
    const settingsEntry = diff.entries.find((e) => e.path === 'settings');
    expect(settingsEntry).toBeDefined();
    expect(settingsEntry?.type).toBe('updated');
    expect(settingsEntry?.label).toBe('Settings');
  });
});
