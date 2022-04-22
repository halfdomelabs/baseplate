import {
  quot,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { scalarFieldTypeInfoMap } from '@src/types/fieldTypes';
import { PrismaOutputModel } from '@src/types/prismaOutput';
import { ServiceOutputDtoField } from '@src/types/serviceOutput';

interface PrimaryKeyOutput {
  argument: string;
  whereClause: string;
  headerTypeBlock?: TypescriptCodeBlock;
}

export function getPrimaryKeyDefinition(
  model: PrismaOutputModel
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
      name: idFieldName,
      type: 'scalar',
      scalarType: idField.scalarType,
    };
  }

  // handle multiple primary key case
  const compoundUniqueName = idFields.join('_');
  const primaryKeyInputName = `${model.name}PrimaryKey`;

  return {
    name: compoundUniqueName,
    type: 'nested',
    nestedType: {
      name: primaryKeyInputName,
      fields: idFields.map((idField) => {
        const field = fields.find((f) => f.name === idField);
        if (!field || field.type !== 'scalar') {
          throw new Error(
            `ID field ${idField} in model ${model.name} must be a scalar`
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
  model: PrismaOutputModel
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

    return {
      argument: `${idFieldName}: ${
        scalarFieldTypeInfoMap[idField.scalarType].typescriptType
      }`,
      whereClause: `{ ${idFieldName} }`,
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
    }
  );

  return {
    argument: `${compoundUniqueName}: ${primaryKeyInputName}`,
    whereClause: `{ ${compoundUniqueName} }`,
    headerTypeBlock,
  };
}
