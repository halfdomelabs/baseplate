import type { PrismaOutputModel } from '#src/types/prisma-output.js';

/**
 * Generates a TypeScript type literal for the `where` parameter based on
 * the model's ID fields.
 *
 * - Single ID field: `{ id: string }`
 * - Composite ID: `{ field1_field2: { field1: string; field2: string } }`
 *
 * @param prismaModel - The Prisma model to generate for
 * @returns A string representing the TypeScript type literal
 */
export function generateWhereType(prismaModel: PrismaOutputModel): string {
  const { idFields } = prismaModel;

  if (!idFields || idFields.length === 0) {
    throw new Error(`Model ${prismaModel.name} has no primary key`);
  }

  if (idFields.length === 1) {
    return `{ ${idFields[0]}: string }`;
  }

  // Composite key: { field1_field2: { field1: string; field2: string } }
  const compositeKey = idFields.join('_');
  const innerFields = idFields.map((f) => `${f}: string`).join('; ');
  return `{ ${compositeKey}: { ${innerFields} } }`;
}

/**
 * Generates a where expression that references fields from an existing item variable.
 *
 * - Single ID: `{ id: existingItem.id }`
 * - Composite ID: `{ field1_field2: { field1: existingItem.field1, field2: existingItem.field2 } }`
 *
 * @param prismaModel - The Prisma model to generate for
 * @param existingItemVar - Variable name for the existing item (default: 'existingItem')
 * @returns A string representing the where expression
 */
export function generateExistingItemWhere(
  prismaModel: PrismaOutputModel,
  existingItemVar = 'existingItem',
): string {
  const { idFields } = prismaModel;

  if (!idFields || idFields.length === 0) {
    throw new Error(`Model ${prismaModel.name} has no primary key`);
  }

  if (idFields.length === 1) {
    return `{ ${idFields[0]}: ${existingItemVar}.${idFields[0]} }`;
  }

  // Composite key: { field1_field2: { field1: existingItem.field1, field2: existingItem.field2 } }
  const compositeKey = idFields.join('_');
  const innerFields = idFields
    .map((f) => `${f}: ${existingItemVar}.${f}`)
    .join(', ');
  return `{ ${compositeKey}: { ${innerFields} } }`;
}
