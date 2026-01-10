import type { PrismaOutputModel } from '#src/types/prisma-output.js';
import type { ServiceOutputDtoField } from '#src/types/service-output.js';

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

/**
 * Generates a getWhereUnique function string for use in defineCreateOperation.
 *
 * For single primary key: `(result) => ({ id: result.id })`
 * For compound primary key: `(result) => ({ field1_field2: { field1: result.field1, field2: result.field2 } })`
 *
 * @param model - The Prisma model to generate the function for
 * @returns A string representation of the getWhereUnique arrow function
 */
export function generateGetWhereUniqueFragment(
  model: PrismaOutputModel,
): string {
  const { idFields } = model;
  if (!idFields?.length) {
    throw new Error(`Model ${model.name} has no primary key`);
  }

  if (idFields.length === 1) {
    // Single primary key: (result) => ({ id: result.id })
    const idField = idFields[0];
    return `(result) => ({ ${idField}: result.${idField} })`;
  }

  // Compound primary key: (result) => ({ field1_field2: { field1: result.field1, field2: result.field2 } })
  const whereUniqueFieldName = idFields.join('_');
  const innerFields = idFields
    .map((field) => `${field}: result.${field}`)
    .join(', ');
  return `(result) => ({ ${whereUniqueFieldName}: { ${innerFields} } })`;
}
