import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import * as R from 'ramda';
import { PrismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import {
  PrismaOutputModel,
  PrismaOutputRelationField,
} from '@src/types/prismaOutput.js';
import { ServiceOutputDtoNestedField } from '@src/types/serviceOutput.js';
import {
  NexusDefinitionWriterOptions,
  writeNexusObjectTypeFieldFromDtoNestedField,
} from '@src/writers/nexus-definition/index.js';

interface RelationFieldWriterContext {
  prismaOutput: PrismaOutputProvider;
  writerOptions: NexusDefinitionWriterOptions;
}

function getResolverForField(
  field: PrismaOutputRelationField,
  model: PrismaOutputModel,
  prismaOutput: PrismaOutputProvider,
): TypescriptCodeExpression {
  if (!field.fields || !field.references) {
    if (!model.idFields) {
      throw new Error('ID field required for relations');
    }

    // resolver where the ID scalar field lives on foreign model
    const RESOLVER_TEMPLATE = `
  (INPUT) => MODEL.findUnique({ where: WHERE_CLAUSE }).RELATION_NAME()
  `.trim();

    return TypescriptCodeUtils.formatExpression(RESOLVER_TEMPLATE, {
      INPUT: `{${model.idFields.join(', ')}}`,
      MODEL: prismaOutput.getPrismaModelExpression(model.name),
      WHERE_CLAUSE: `{${model.idFields.join(', ')}}`,
      RELATION_NAME: field.name,
    });
  }

  // resolver where the ID scalar field lives on foreign model
  //  TODO: Support optional field IDs

  const RESOLVER_TEMPLATE = `
  (INPUT) => OPTIONAL_CHECK MODEL.findUniqueOrThrow({ where: WHERE_CLAUSE })
  `.trim();

  if (field.fields.length !== field.references.length || !field.fields.length) {
    throw new Error('Fields and references must be the same length > 0');
  }

  return TypescriptCodeUtils.formatExpression(RESOLVER_TEMPLATE, {
    INPUT: `{${field.fields.join(', ')}}`,
    MODEL: prismaOutput.getPrismaModelExpression(field.modelType),
    OPTIONAL_CHECK: field.isOptional
      ? `${field.fields.map((f) => `${f} == null`).join(' || ')} ? null : `
      : '',
    WHERE_CLAUSE: TypescriptCodeUtils.mergeExpressionsAsObject(
      R.mergeAll(
        field.fields.map((localName, index) => ({
          [(field.references || [])[index]]: localName,
        })),
      ),
    ),
    RELATION_NAME: field.name,
  });
}

export function writeObjectTypeRelationField(
  field: ServiceOutputDtoNestedField,
  model: PrismaOutputModel,
  { prismaOutput, writerOptions }: RelationFieldWriterContext,
): TypescriptCodeBlock {
  const prismaField = model.fields.find((f) => f.name === field.name);

  if (prismaField?.type !== 'relation') {
    throw new Error(
      `Relation field ${field.name} not found in model ${model.name}`,
    );
  }

  return writeNexusObjectTypeFieldFromDtoNestedField(
    field,
    getResolverForField(prismaField, model, prismaOutput),
    writerOptions,
  );
}
