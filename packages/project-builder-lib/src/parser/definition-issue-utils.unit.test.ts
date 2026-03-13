import { produce } from 'immer';
import { describe, expect, it } from 'vitest';

import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '#src/testing/definition-helpers.test-helper.js';
import { createTestProjectDefinitionContainer } from '#src/testing/project-definition-container.test-helper.js';

import { createIssueFixSetter } from './definition-issue-utils.js';

describe('createIssueFixSetter', () => {
  const feature = createTestFeature({ name: 'core' });

  it('returns undefined when issue has no fix', () => {
    const container = createTestProjectDefinitionContainer({
      features: [feature],
    });

    const result = createIssueFixSetter(
      { message: 'test', severity: 'warning', path: ['settings'] },
      container,
    );
    expect(result).toBeUndefined();
  });

  it('returns applySetter directly when fix uses applySetter', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- test stub
    const applySetter = (): void => {};
    const container = createTestProjectDefinitionContainer({
      features: [feature],
    });

    const result = createIssueFixSetter(
      {
        message: 'test',
        severity: 'warning',
        path: ['settings'],
        fix: { label: 'Fix it', applySetter },
      },
      container,
    );
    expect(result).toBe(applySetter);
  });

  it('returns a setter that applies local-value fix at the resolved path', () => {
    const container = createTestProjectDefinitionContainer({
      features: [feature],
      models: [
        createTestModel({
          name: 'User',
          featureRef: feature.name,
          model: {
            fields: [createTestScalarField({ name: 'id', type: 'uuid' })],
            primaryKeyFieldRefs: ['id'],
          },
        }),
      ],
    });

    const model = container.definition.models[0];
    const field = model.model.fields[0];

    const result = createIssueFixSetter(
      {
        message: 'test',
        severity: 'warning',
        entityId: model.id,
        path: ['model', 'fields', 0, 'name'],
        fix: {
          label: 'Rename field',
          apply: () => 'renamedField',
        },
      },
      container,
    );

    if (!result) {
      throw new Error('Expected result to be defined');
    }

    const fixedDefinition = produce(container.definition, result);
    expect(fixedDefinition.models[0].model.fields[0].name).toBe('renamedField');
    // Original should be unchanged
    expect(field.name).toBe('id');
  });
});
