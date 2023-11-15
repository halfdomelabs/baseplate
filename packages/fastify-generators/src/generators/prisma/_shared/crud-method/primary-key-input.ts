import {
  quot,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';

import { getScalarFieldTypeInfo } from '@src/types/fieldTypes.js';
import { PrismaOutputModel } from '@src/types/prismaOutput.js';
import { ServiceOutputDtoField } from '@src/types/serviceOutput.js';

interface PrimaryKeyOutput {
  argumentName: string;
  whereClause: string;
  headerTypeBlock?: TypescriptCodeBlock;
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

export function getPrimaryKeyExpressions(
  model: PrismaOutputModel,
): PrimaryKeyOutput {
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
  const compoundUniqueName = idFields.join('_');
  const primaryKeyInputName = `${model.name}PrimaryKey`;

  const headerTypeBlock = TypescriptCodeUtils.createBlock(
    `export type ${primaryKeyInputName} = Pick<${model.name}, ${idFields
      .map(quot)
      .join(' | ')}>`,
    `import {${model.name}} from '@prisma/client';`,
    {
      headerKey: primaryKeyInputName,
    },
  );

  return {
    argumentName: compoundUniqueName,
    whereClause: `{ ${compoundUniqueName} }`,
    headerTypeBlock,
    argumentType: primaryKeyInputName,
  };
}
