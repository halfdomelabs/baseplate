import {
  tsUtilsProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptSourceBlock,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { serviceFileOutputProvider } from '@src/generators/core/service-file';
import { nexusTypeProvider } from '@src/providers/nexus-type';
import { ServiceOutputDtoField } from '@src/types/serviceOutput';
import { lowerCaseFirst } from '@src/utils/case';
import {
  writeChildInputDefinition,
  writeNexusInputDefinitionFromDtoFields,
} from '@src/writers/nexus-definition';
import { nexusSchemaProvider } from '../nexus';
import { nexusTypesFileProvider } from '../nexus-types-file';

const descriptorSchema = yup.object({
  modelName: yup.string().required(),
  type: yup.string().oneOf(['create', 'update', 'delete']).required(),
  crudServiceRef: yup.string().required(),
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
  async resolve(root, { input: INPUT_PARTS }) {
    const RETURN_FIELD_NAME = await SERVICE_CALL(SERVICE_ARGUMENTS);
    return { RETURN_FIELD_NAME };
  },
});
`.trim();

const NexusPrismaCrudMutation = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    authorize: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/nexus/nexus-authorize-field',
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
    { nexusSchema, nexusTypesFile, serviceFileOutput, tsUtils }
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
        SERVICE_CALL: { type: 'code-expression' },
        SERVICE_ARGUMENTS: { type: 'code-expression' },
        RETURN_FIELD_NAME: { type: 'code-expression' },
      },
      {
        importText: [
          `import { createStandardMutation } from '${nexusSchema.getUtilsImport()}';`,
        ],
      }
    );

    const inputDefinitions = writeNexusInputDefinitionFromDtoFields(
      serviceOutput.arguments,
      {
        builder: 't',
        lookupScalar: (scalar) => nexusSchema.getScalarConfig(scalar),
      }
    );

    const argNames = serviceOutput.arguments.map((arg) => arg.name);

    function convertArgForCall(
      arg: ServiceOutputDtoField
    ): TypescriptCodeExpression {
      // TODO: Handle convert all nulls
      if (arg.isOptional && !arg.isNullable) {
        throw new Error(`Optional non-nullable top-level args not handled`);
      }
      if (arg.type === 'nested') {
        const nonNullableOptionalFields = arg.nestedType.fields.filter(
          (f) => f.isOptional && !f.isNullable
        );
        if (nonNullableOptionalFields.length) {
          return TypescriptCodeUtils.createExpression(
            `restrictObjectNulls(${arg.name}, [${nonNullableOptionalFields
              .map((f) => `'${f.name}'`)
              .join(', ')}])`,
            `import {restrictObjectNulls} from '%ts-utils/nulls';`,
            { importMappers: [tsUtils] }
          );
        }
      }
      return new TypescriptCodeExpression(arg.name);
    }

    objectTypeBlock.addCodeEntries({
      MUTATION_EXPORT: `${type}${modelName}Mutation`,
      MUTATION_NAME: `'${type}${modelName}'`,
      MUTATION_INPUT_DEFINITION: inputDefinitions.definition,
      OBJECT_TYPE_NAME: `'${modelName}'`,
      INPUT_PARTS: `{ ${argNames.join(', ')} }`,
      SERVICE_CALL: serviceOutput.expression,
      SERVICE_ARGUMENTS: TypescriptCodeUtils.mergeExpressions(
        serviceOutput.arguments.map(convertArgForCall),
        ', '
      ),
      RETURN_FIELD_NAME: lowerCaseFirst(modelName),
    });

    inputDefinitions.childInputDefinitions.forEach((child) => {
      nexusTypesFile.registerType(writeChildInputDefinition(child), child.name);
    });

    return {
      getProviders: () => ({
        nexusType: {
          addCustomField(fieldName, fieldType) {
            objectTypeBlock.addStringReplacement(
              'CUSTOM_FIELDS',
              fieldType.prepend(`${fieldName}: `).toStringReplacement()
            );
          },
        },
      }),
      build: () => {
        // TODO: Make it easier to do simple replaces
        nexusTypesFile.registerType(
          objectTypeBlock.renderToBlock(
            MUTATION_TEMPLATE.replace(
              'RETURN_FIELD_NAME',
              lowerCaseFirst(modelName)
            )
          )
        );
      },
    };
  },
});

export default NexusPrismaCrudMutation;
