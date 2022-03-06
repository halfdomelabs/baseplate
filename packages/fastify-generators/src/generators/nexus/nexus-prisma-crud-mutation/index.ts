import {
  tsUtilsProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptSourceBlock,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaCrudServiceOutputProvider } from '@src/generators/prisma/prisma-crud-service';
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
  name: MUTATION_NAME,
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
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    nexusSchema: nexusSchemaProvider,
    nexusTypesFile: nexusTypesFileProvider,
    prismaCrudServiceOutput: prismaCrudServiceOutputProvider,
    tsUtils: tsUtilsProvider,
  },
  populateDependencies: (dependencyMap, { crudServiceRef }) => ({
    ...dependencyMap,
    prismaCrudServiceOutput: dependencyMap.prismaCrudServiceOutput
      .dependency()
      .reference(crudServiceRef),
  }),
  createGenerator(
    { modelName, type },
    { nexusSchema, nexusTypesFile, prismaCrudServiceOutput, tsUtils }
  ) {
    const serviceOutput = prismaCrudServiceOutput.getServiceMethod(type);

    const objectTypeBlock = new TypescriptSourceBlock(
      {
        MUTATION_EXPORT: { type: 'code-expression' },
        MUTATION_NAME: { type: 'code-expression' },
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
          return tsUtils
            .getUtilExpression('restrictObjectNulls')
            .append(
              `(${arg.name}, [${nonNullableOptionalFields
                .map((f) => `'${f.name}'`)
                .join(', ')}])`
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
      nexusTypesFile.registerType(writeChildInputDefinition(child));
    });

    // TODO: Make it easier to do simple replaces
    nexusTypesFile.registerType(
      objectTypeBlock.renderToBlock(
        MUTATION_TEMPLATE.replace(
          'RETURN_FIELD_NAME',
          lowerCaseFirst(modelName)
        )
      )
    );

    return {
      build: async () => {},
    };
  },
});

export default NexusPrismaCrudMutation;
