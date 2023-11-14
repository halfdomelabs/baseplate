import {
  TsUtilsProvider,
  tsUtilsProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptSourceBlock,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { singularize } from 'inflection';
import { z } from 'zod';

import { nexusSchemaProvider } from '../nexus/index.js';
import { nexusTypesFileProvider } from '../nexus-types-file/index.js';
import { serviceFileOutputProvider } from '@src/generators/core/service-file/index.js';
import { nexusTypeProvider } from '@src/providers/nexus-type.js';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoNestedField,
} from '@src/types/serviceOutput.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import {
  writeChildInputDefinition,
  writeNexusInputDefinitionFromDtoFields,
} from '@src/writers/nexus-definition/index.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  type: z.enum(['create', 'update', 'delete']),
  crudServiceRef: z.string().min(1),
});

// TODO: Use expression for createStandardMutation
const MUTATION_TEMPLATE = `
export const MUTATION_EXPORT = createStandardMutation({
  name: MUTATION_NAME, // CUSTOM_FIELDS
  inputDefinition(t) {
    MUTATION_INPUT_DEFINITION;
  },
  payloadDefinition(t) {
    t.nonNull.field('RETURN_FIELD_NAME', { type: OBJECT_TYPE_NAME });
  },
  async resolve(root, { input: INPUT_PARTS }, CONTEXT) {
    const RETURN_FIELD_NAME = await SERVICE_CALL(SERVICE_ARGUMENTS);
    return { RETURN_FIELD_NAME };
  },
});
`.trim();

function buildNestedArgExpression(
  arg: ServiceOutputDtoNestedField,
  tsUtils: TsUtilsProvider,
): TypescriptCodeExpression {
  if (arg.isPrismaType) {
    throw new Error(`Prisma types are not supported in nested fields`);
  }
  const { fields } = arg.nestedType;
  const nestedFields = fields.filter(
    (f): f is ServiceOutputDtoNestedField => f.type === 'nested',
  );

  if (nestedFields.length) {
    // look for all nested expressions with restrictions
    const nestedExpressionsWithRestrict = nestedFields
      .map((nestedField) => ({
        field: nestedField,
        // mutual recursion
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        expression: convertNestedArgForCall(
          {
            ...nestedField,
            name: nestedField.isList
              ? singularize(nestedField.name)
              : `${arg.name}.${nestedField.name}`,
          },
          tsUtils,
        ),
      }))
      .filter((f) => f.expression.content.includes('restrictObjectNulls'));

    if (nestedExpressionsWithRestrict.length) {
      return TypescriptCodeUtils.formatExpression(
        `{
          ...${arg.name},
          RESTRICT_EXPRESSIONS
        }`,
        {
          RESTRICT_EXPRESSIONS: TypescriptCodeUtils.mergeExpressions(
            nestedExpressionsWithRestrict.map(({ field, expression }) => {
              if (field.isList) {
                return expression.wrap(
                  (contents) =>
                    `${field.name}: ${arg.name}.${
                      field.name
                    }?.map((${singularize(field.name)}) => ${
                      contents.trimStart().startsWith('{')
                        ? `(${contents})`
                        : contents
                    })`,
                );
              }
              return expression.wrap(
                (contents) =>
                  `${field.name}: ${arg.name}.${field.name} && ${contents}`,
              );
            }),
            ',\n',
          ),
        },
      );
    }
  }
  return new TypescriptCodeExpression(arg.name);
}

function convertNestedArgForCall(
  arg: ServiceOutputDtoNestedField,
  tsUtils: TsUtilsProvider,
): TypescriptCodeExpression {
  if (arg.isPrismaType) {
    throw new Error(`Prisma types are not supported in nested fields`);
  }
  const { fields } = arg.nestedType;
  const nonNullableOptionalFields = fields.filter(
    (f) => f.isOptional && !f.isNullable,
  );

  const nestedArgExpression: TypescriptCodeExpression =
    buildNestedArgExpression(arg, tsUtils);

  if (nonNullableOptionalFields.length) {
    return TypescriptCodeUtils.formatExpression(
      `restrictObjectNulls(ARG, [${nonNullableOptionalFields
        .map((f) => `'${f.name}'`)
        .join(', ')}])`,
      { ARG: nestedArgExpression },
      {
        importText: [`import {restrictObjectNulls} from '%ts-utils/nulls';`],
        importMappers: [tsUtils],
      },
    );
  }
  return nestedArgExpression;
}

function convertArgForCall(
  arg: ServiceOutputDtoField,
  tsUtils: TsUtilsProvider,
): TypescriptCodeExpression {
  // TODO: Handle convert all nulls
  if (arg.isOptional && !arg.isNullable) {
    throw new Error(`Optional non-nullable top-level args not handled`);
  }
  if (arg.type === 'nested') {
    return convertNestedArgForCall(arg, tsUtils);
  }
  return new TypescriptCodeExpression(arg.name);
}

const NexusPrismaCrudMutation = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    authorize: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/nexus/nexus-authorize-field',
      },
    },
  }),
  dependencies: {
    nexusSchema: nexusSchemaProvider,
    nexusTypesFile: nexusTypesFileProvider,
    serviceFileOutput: serviceFileOutputProvider,
    tsUtils: tsUtilsProvider,
  },
  populateDependencies: (dependencyMap, { crudServiceRef }) => ({
    ...dependencyMap,
    serviceFileOutput: dependencyMap.serviceFileOutput
      .dependency()
      .reference(crudServiceRef),
  }),
  exports: {
    nexusType: nexusTypeProvider,
  },
  createGenerator(
    { modelName, type },
    { nexusSchema, nexusTypesFile, serviceFileOutput, tsUtils },
  ) {
    const serviceOutput = serviceFileOutput.getServiceMethod(type);

    const objectTypeBlock = new TypescriptSourceBlock(
      {
        MUTATION_EXPORT: { type: 'code-expression' },
        MUTATION_NAME: { type: 'code-expression' },
        CUSTOM_FIELDS: {
          type: 'string-replacement',
          asSingleLineComment: true,
          transform: (value) => `\n${value},`,
        },
        MUTATION_INPUT_DEFINITION: { type: 'code-block' },
        OBJECT_TYPE_NAME: { type: 'code-expression' },
        INPUT_PARTS: { type: 'code-expression' },
        CONTEXT: { type: 'code-expression' },
        SERVICE_CALL: { type: 'code-expression' },
        SERVICE_ARGUMENTS: { type: 'code-expression' },
        RETURN_FIELD_NAME: { type: 'code-expression' },
      },
      {
        importText: [
          `import { createStandardMutation } from '${nexusSchema.getUtilsImport()}';`,
        ],
      },
    );

    const inputDefinitions = writeNexusInputDefinitionFromDtoFields(
      serviceOutput.arguments,
      {
        builder: 't',
        lookupScalar: (scalar) => nexusSchema.getScalarConfig(scalar),
      },
    );

    const argNames = serviceOutput.arguments.map((arg) => arg.name);

    objectTypeBlock.addCodeEntries({
      MUTATION_EXPORT: `${type}${modelName}Mutation`,
      MUTATION_NAME: `'${type}${modelName}'`,
      MUTATION_INPUT_DEFINITION: inputDefinitions.definition,
      OBJECT_TYPE_NAME: `'${modelName}'`,
      INPUT_PARTS: `{ ${argNames.join(', ')} }`,
      CONTEXT: serviceOutput.requiresContext ? 'context' : '',
      SERVICE_CALL: serviceOutput.expression,
      SERVICE_ARGUMENTS: TypescriptCodeUtils.mergeExpressions(
        serviceOutput.arguments.map((arg) => convertArgForCall(arg, tsUtils)),
        ', ',
      ).append(serviceOutput.requiresContext ? ', context' : ''),
      RETURN_FIELD_NAME: lowerCaseFirst(modelName),
    });

    inputDefinitions.childInputDefinitions.forEach((child) => {
      nexusTypesFile.registerType({
        name: child.name,
        block: writeChildInputDefinition(child),
      });
    });

    return {
      getProviders: () => ({
        nexusType: {
          addCustomField(fieldName, fieldType) {
            objectTypeBlock.addStringReplacement(
              'CUSTOM_FIELDS',
              fieldType.prepend(`${fieldName}: `).toStringReplacement(),
            );
          },
        },
      }),
      build: () => {
        // TODO: Make it easier to do simple replaces
        nexusTypesFile.registerType({
          block: objectTypeBlock.renderToBlock(
            MUTATION_TEMPLATE.replace(
              'RETURN_FIELD_NAME',
              lowerCaseFirst(modelName),
            ),
          ),
        });
      },
    };
  },
});

export default NexusPrismaCrudMutation;
