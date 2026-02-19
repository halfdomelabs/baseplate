import { describe, expect, it } from 'vitest';

import {
  createTestModel,
  createTestRelationField,
  createTestScalarField,
  createTestUniqueConstraint,
} from '#src/schema/definition.test-helper.js';

import { ModelFieldUtils } from './model-field-utils.js';

const { getRelationLocalFields, isRelationOneToOne, isRelationOptional } =
  ModelFieldUtils;

describe('getRelationLocalFields', () => {
  it('should return a single local field of a relation', () => {
    const model = createTestModel({
      model: {
        primaryKeyFieldRefs: ['localField'],
        fields: [
          createTestScalarField({
            id: 'local',
            name: 'localField',
            type: 'date',
          }),
          createTestScalarField({ id: 'other', name: 'otherField' }),
        ],
      },
    });
    const relation = createTestRelationField({
      references: [{ localRef: 'local', foreignRef: 'foreign' }],
    });

    const localFields = getRelationLocalFields(model, relation);

    expect(localFields).toEqual([model.model.fields[0]]);
  });

  it('should return the local fields of a relation', () => {
    const model = createTestModel({
      model: {
        primaryKeyFieldRefs: ['local-id', 'local-id2'],
        fields: [
          createTestScalarField({
            id: 'local-id',
            name: 'localField',
            type: 'date',
          }),
          createTestScalarField({
            id: 'local-id2',
            name: 'localField2',
            type: 'date',
          }),
          createTestScalarField({ name: 'otherField' }),
        ],
      },
    });
    const relation = createTestRelationField({
      references: [
        { localRef: 'local-id', foreignRef: 'foreignField' },
        { localRef: 'local-id2', foreignRef: 'foreignField2' },
      ],
    });

    const localFields = getRelationLocalFields(model, relation);

    expect(localFields).toEqual([model.model.fields[0], model.model.fields[1]]);
  });
});

describe('isRelationOptional', () => {
  it('should return true if any local field is optional', () => {
    const model = createTestModel({
      model: {
        primaryKeyFieldRefs: ['local-id'],
        fields: [
          createTestScalarField({
            id: 'local-id',
            name: 'localField',
            type: 'date',
            isOptional: true,
          }),
          createTestScalarField({ name: 'otherField' }),
        ],
      },
    });
    const relation = createTestRelationField({
      references: [{ localRef: 'local-id', foreignRef: 'foreignField' }],
    });

    const isOptional = isRelationOptional(model, relation);

    expect(isOptional).toBe(true);
  });

  it('should return false if no local field is optional', () => {
    const model = createTestModel({
      model: {
        primaryKeyFieldRefs: ['local-id'],
        fields: [
          createTestScalarField({
            id: 'local-id',
            name: 'localField',
            type: 'date',
          }),
          createTestScalarField({
            name: 'otherField',
            isOptional: true,
          }),
        ],
      },
    });
    const relation = createTestRelationField({
      references: [{ localRef: 'local-id', foreignRef: 'foreignField' }],
    });

    const isOptional = isRelationOptional(model, relation);

    expect(isOptional).toBe(false);
  });
});

describe('isRelationOneToOne', () => {
  it('should return true if the relation is a primary key', () => {
    const model = createTestModel({
      model: {
        primaryKeyFieldRefs: ['local-id'],
        fields: [
          createTestScalarField({
            id: 'local-id',
            name: 'localField',
          }),
          createTestScalarField({
            name: 'otherField',
            isOptional: true,
          }),
        ],
      },
    });
    const relation = createTestRelationField({
      references: [{ localRef: 'local-id', foreignRef: 'foreignField' }],
    });

    const isOneToOne = isRelationOneToOne(model, relation);

    expect(isOneToOne).toBe(true);
  });

  it('should return true if the relation is a unique constraint', () => {
    const model = createTestModel({
      model: {
        primaryKeyFieldRefs: ['local-id'],
        uniqueConstraints: [
          createTestUniqueConstraint({
            fields: [{ fieldRef: 'local-id' }, { fieldRef: 'local-id2' }],
          }),
        ],
        fields: [
          createTestScalarField({
            id: 'local-id',
            name: 'localField',
          }),
          createTestScalarField({
            id: 'local-id2',
            name: 'localField2',
          }),
          createTestScalarField({
            name: 'otherField',
            isOptional: true,
          }),
        ],
      },
    });
    const relation = createTestRelationField({
      references: [
        { localRef: 'local-id', foreignRef: 'foreignField' },
        { localRef: 'local-id2', foreignRef: 'foreignField' },
      ],
    });

    const isOneToOne = isRelationOneToOne(model, relation);

    expect(isOneToOne).toBe(true);
  });
});
