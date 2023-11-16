import { describe, expect, it } from 'vitest';

import {
  getModelLocalFields,
  isModelRelationOneToOne,
  isModelRelationOptional,
} from './model.js';
import {
  generateMockModel,
  generateMockModelRelationField,
  generateMockModelScalarField,
  generateMockUniqueConstraint,
} from '@src/schema/models/mocks.js';

describe('getModelLocalFields', () => {
  it('should return a single local field of a relation', () => {
    const model = generateMockModel({
      model: {
        fields: [
          generateMockModelScalarField({ name: 'localField', type: 'date' }),
          generateMockModelScalarField({ name: 'otherField' }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [{ local: 'localField', foreign: 'foreignField' }],
    });

    const localFields = getModelLocalFields(model, relation);

    expect(localFields).toEqual([model.model.fields[0]]);
  });

  it('should return the local fields of a relation', () => {
    const model = generateMockModel({
      model: {
        fields: [
          generateMockModelScalarField({ name: 'localField', type: 'date' }),
          generateMockModelScalarField({ name: 'localField2', type: 'date' }),
          generateMockModelScalarField({ name: 'otherField' }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [
        { local: 'localField', foreign: 'foreignField' },
        { local: 'localField2', foreign: 'foreignField2' },
      ],
    });

    const localFields = getModelLocalFields(model, relation);

    expect(localFields).toEqual([model.model.fields[0], model.model.fields[1]]);
  });
});

describe('isModelRelationOptional', () => {
  it('should return true if any local field is optional', () => {
    const model = generateMockModel({
      model: {
        fields: [
          generateMockModelScalarField({
            name: 'localField',
            type: 'date',
            isOptional: true,
          }),
          generateMockModelScalarField({ name: 'otherField' }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [{ local: 'localField', foreign: 'foreignField' }],
    });

    const isOptional = isModelRelationOptional(model, relation);

    expect(isOptional).toBe(true);
  });

  it('should return false if no local field is optional', () => {
    const model = generateMockModel({
      model: {
        fields: [
          generateMockModelScalarField({
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
      references: [{ local: 'localField', foreign: 'foreignField' }],
    });

    const isOptional = isModelRelationOptional(model, relation);

    expect(isOptional).toBe(false);
  });
});

describe('isModelRelationOneToOne', () => {
  it('should return true if the relation is a primary key', () => {
    const model = generateMockModel({
      model: {
        primaryKeys: ['localField'],
        fields: [
          generateMockModelScalarField({
            name: 'localField',
            isId: true,
          }),
          generateMockModelScalarField({
            name: 'otherField',
            isOptional: true,
          }),
        ],
      },
    });
    const relation = generateMockModelRelationField({
      references: [{ local: 'localField', foreign: 'foreignField' }],
    });

    const isOneToOne = isModelRelationOneToOne(model, relation);

    expect(isOneToOne).toBe(true);
  });

  it('should return true if the relation is a unique constraint', () => {
    const model = generateMockModel({
      model: {
        uniqueConstraints: [
          generateMockUniqueConstraint({
            fields: [{ name: 'localField' }, { name: 'localField2' }],
          }),
        ],
        fields: [
          generateMockModelScalarField({
            name: 'localField',
          }),
          generateMockModelScalarField({
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
        { local: 'localField', foreign: 'foreignField' },
        { local: 'localField2', foreign: 'foreignField' },
      ],
    });

    const isOneToOne = isModelRelationOneToOne(model, relation);

    expect(isOneToOne).toBe(true);
  });
});
