import { describe, expect, it } from 'vitest';

import {
  generateMockModel,
  generateMockModelRelationField,
  generateMockModelScalarField,
  generateMockUniqueConstraint,
} from '@src/schema/models/mocks.js';

import { ModelFieldUtils } from './model-field-utils.js';

const { getRelationLocalFields, isRelationOneToOne, isRelationOptional } =
  ModelFieldUtils;

describe('getRelationLocalFields', () => {
  it('should return a single local field of a relation', () => {
    const model = generateMockModel({
      model: {
        primaryKeyFieldRefs: ['localField'],
        fields: [
          generateMockModelScalarField({
            id: 'local',
            name: 'localField',
            type: 'date',
          }),
          generateMockModelScalarField({ id: 'other', name: 'otherField' }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [{ local: 'local', foreign: 'foreign' }],
    });

    const localFields = getRelationLocalFields(model, relation);

    expect(localFields).toEqual([model.model.fields[0]]);
  });

  it('should return the local fields of a relation', () => {
    const model = generateMockModel({
      model: {
        primaryKeyFieldRefs: ['local-id', 'local-id2'],
        fields: [
          generateMockModelScalarField({
            id: 'local-id',
            name: 'localField',
            type: 'date',
          }),
          generateMockModelScalarField({
            id: 'local-id2',
            name: 'localField2',
            type: 'date',
          }),
          generateMockModelScalarField({ name: 'otherField' }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [
        { local: 'local-id', foreign: 'foreignField' },
        { local: 'local-id2', foreign: 'foreignField2' },
      ],
    });

    const localFields = getRelationLocalFields(model, relation);

    expect(localFields).toEqual([model.model.fields[0], model.model.fields[1]]);
  });
});

describe('isRelationOptional', () => {
  it('should return true if any local field is optional', () => {
    const model = generateMockModel({
      model: {
        primaryKeyFieldRefs: ['local-id'],
        fields: [
          generateMockModelScalarField({
            id: 'local-id',
            name: 'localField',
            type: 'date',
            isOptional: true,
          }),
          generateMockModelScalarField({ name: 'otherField' }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [{ local: 'local-id', foreign: 'foreignField' }],
    });

    const isOptional = isRelationOptional(model, relation);

    expect(isOptional).toBe(true);
  });

  it('should return false if no local field is optional', () => {
    const model = generateMockModel({
      model: {
        primaryKeyFieldRefs: ['local-id'],
        fields: [
          generateMockModelScalarField({
            id: 'local-id',
            name: 'localField',
            type: 'date',
          }),
          generateMockModelScalarField({
            name: 'otherField',
            isOptional: true,
          }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [{ local: 'local-id', foreign: 'foreignField' }],
    });

    const isOptional = isRelationOptional(model, relation);

    expect(isOptional).toBe(false);
  });
});

describe('isRelationOneToOne', () => {
  it('should return true if the relation is a primary key', () => {
    const model = generateMockModel({
      model: {
        primaryKeyFieldRefs: ['local-id'],
        fields: [
          generateMockModelScalarField({
            id: 'local-id',
            name: 'localField',
          }),
          generateMockModelScalarField({
            name: 'otherField',
            isOptional: true,
          }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [{ local: 'local-id', foreign: 'foreignField' }],
    });

    const isOneToOne = isRelationOneToOne(model, relation);

    expect(isOneToOne).toBe(true);
  });

  it('should return true if the relation is a unique constraint', () => {
    const model = generateMockModel({
      model: {
        primaryKeyFieldRefs: ['local-id'],
        uniqueConstraints: [
          generateMockUniqueConstraint({
            fields: [{ fieldRef: 'local-id' }, { fieldRef: 'local-id2' }],
          }),
        ],
        fields: [
          generateMockModelScalarField({
            id: 'local-id',
            name: 'localField',
          }),
          generateMockModelScalarField({
            id: 'local-id2',
            name: 'localField2',
          }),
          generateMockModelScalarField({
            name: 'otherField',
            isOptional: true,
          }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [
        { local: 'local-id', foreign: 'foreignField' },
        { local: 'local-id2', foreign: 'foreignField' },
      ],
    });

    const isOneToOne = isRelationOneToOne(model, relation);

    expect(isOneToOne).toBe(true);
  });
});
