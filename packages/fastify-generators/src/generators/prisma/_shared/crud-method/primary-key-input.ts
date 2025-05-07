import type { TsHoistedFragment } from '@halfdomelabs/core-generators';

import {
  tsHoistedFragment,
  tsImportBuilder,
} from '@halfdomelabs/core-generators';
import { quot } from '@halfdomelabs/utils';

import type { PrismaOutputModel } from '@src/types/prisma-output.js';
import type { ServiceOutputDtoField } from '@src/types/service-output.js';

import { getScalarFieldTypeInfo } from '@src/types/field-types.js';

interface PrimaryKeyOutput {
  argumentName: string;
  whereClause: string;
  headerTypeBlock?: TsHoistedFragment;
  argumentType: string;
}

export function getPrimaryKeyDefinition(
  model: PrismaOutputModel,
): ServiceOutputDtoField {
  const { idFields, fields } = model;
  if (!idFields?.length) {
    throw new Error(`Model ${model.name} has no primary key`);
  }

  if (idFields.length === 1) {
    // handle trivial one primary key case
    const idFieldName = idFields[0];
    const idField = fields.find((f) => f.name === idFieldName);

    if (!idField || idField.type !== 'scalar') {
      throw new Error(`Model ${model.name} must have a scalar primary key`);
    }

    return {
      name: 'id',
      type: 'scalar',
      scalarType: idField.scalarType,
    };
  }

  // handle multiple primary key case
  const primaryKeyInputName = `${model.name}PrimaryKey`;

  return {
    name: 'id',
    type: 'nested',
    nestedType: {
      name: primaryKeyInputName,
      fields: idFields.map((idField) => {
        const field = fields.find((f) => f.name === idField);
        if (!field || field.type !== 'scalar') {
          throw new Error(
            `ID field ${idField} in model ${model.name} must be a scalar`,
          );
        }

        return {
          name: idField,
          type: 'scalar',
          scalarType: field.scalarType,
        };
      }),
    },
  };
}

export function getModelIdFieldName(model: PrismaOutputModel): string {
  const { idFields } = model;
  if (!idFields?.length) {
    throw new Error(`Model ${model.name} has no primary key`);
  }

  if (idFields.length === 1) {
    // handle trivial one primary key case
    return idFields[0];
  }

  // handle multiple primary key case
  return idFields.join('_');
}

export function getPrimaryKeyExpressions(
  model: PrismaOutputModel,
): PrimaryKeyOutput {
  const { idFields, fields } = model;
  if (!idFields?.length) {
    throw new Error(`Model ${model.name} has no primary key`);
  }

  const idFieldName = getModelIdFieldName(model);

  if (idFields.length === 1) {
    // handle trivial one primary key case
    const idField = fields.find((f) => f.name === idFieldName);

    if (!idField || idField.type !== 'scalar') {
      throw new Error(`Model ${model.name} must have a scalar primary key`);
    }

    const argumentType = getScalarFieldTypeInfo(
      idField.scalarType,
    ).typescriptType;

    return {
      argumentName: idFieldName,
      whereClause: `{ ${idFieldName} }`,
      argumentType,
    };
  }

  // handle multiple primary key case
  const primaryKeyInputName = `${model.name}PrimaryKey`;

  const headerTypeBlock = tsHoistedFragment(
    `input-type:${primaryKeyInputName}`,
    `export type ${primaryKeyInputName} = Pick<${model.name}, ${idFields.map(quot).join(' | ')}>`,
    tsImportBuilder([model.name]).from('@prisma/client'),
  );

  return {
    argumentName: idFieldName,
    whereClause: `{ ${idFieldName} }`,
    headerTypeBlock,
    argumentType: primaryKeyInputName,
  };
}
