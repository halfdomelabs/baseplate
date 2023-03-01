import {
  quot,
  tsUtilsProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { z } from 'zod';
import { serviceFileOutputProvider } from '@src/generators/core/service-file';
import { pothosFieldProvider } from '@src/providers/pothos-field';
import { pothosTypeOutputProvider } from '@src/providers/pothos-type';
import { lowerCaseFirst } from '@src/utils/case';
import {
  writePothosInputFieldsFromDtoFields,
  writePothosSimpleObjectFieldsFromDtoFields,
} from '@src/writers/pothos';
import { writeValueFromPothosArg } from '@src/writers/pothos/resolvers';
import { pothosSchemaProvider } from '../pothos';
import { pothosTypesFileProvider } from '../pothos-types-file';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  type: z.enum(['create', 'update', 'delete']),
  objectTypeRef: z.string().min(1),
  crudServiceRef: z.string().min(1),
});

type Descriptor = z.infer<typeof descriptorSchema>;

const createMainTask = createTaskConfigBuilder(
  ({ modelName, type, objectTypeRef, crudServiceRef }: Descriptor) => ({
    name: 'main',
    dependencies: {
      pothosSchema: pothosSchemaProvider,
      pothosTypesFile: pothosTypesFileProvider,
      serviceFileOutput: serviceFileOutputProvider
        .dependency()
        .reference(crudServiceRef),
      tsUtils: tsUtilsProvider,
      pothosObjectType: pothosTypeOutputProvider
        .dependency()
        .reference(objectTypeRef),
    },
    exports: {
      pothosField: pothosFieldProvider,
    },
    run({
      pothosSchema,
      pothosTypesFile,
      serviceFileOutput,
      tsUtils,
      pothosObjectType,
    }) {
      const serviceOutput = serviceFileOutput.getServiceMethod(type);
      const typeReferences = pothosSchema.getTypeReferences();

      const mutationName = `${type}${modelName}`;

      const customFields = createNonOverwriteableMap<
        Record<string, TypescriptCodeExpression>
      >({});

      const inputFields = writePothosInputFieldsFromDtoFields(
        serviceOutput.arguments,
        {
          typeReferences,
          schemaBuilder: 'builder',
          fieldBuilder: 't.input',
        }
      );

      return {
        getProviders: () => ({
          pothosField: {
            addCustomOption(field) {
              customFields.set(field.name, field.value);
            },
          },
        }),
        build: () => {
          inputFields.childDefinitions?.forEach((childDefinition) => {
            pothosTypesFile.registerType({
              name: childDefinition.name,
              block: childDefinition.definition,
            });
          });

          const returnFieldName = lowerCaseFirst(modelName);

          const payloadFields = writePothosSimpleObjectFieldsFromDtoFields(
            [
              {
                name: returnFieldName,
                type: 'nested',
                isPrismaType: true,
                nestedType: { name: modelName },
              },
            ],
            {
              typeReferences: typeReferences.cloneWithObjectType(
                pothosObjectType.getTypeReference()
              ),
              schemaBuilder: 'builder',
              fieldBuilder: 't.payload',
            }
          );

          const argNames = serviceOutput.arguments.map((arg) => arg.name);

          const resolveFunction = TypescriptCodeUtils.formatExpression(
            `async (root, { input: INPUT_PARTS }, CONTEXT) => {
              const RETURN_FIELD_NAME = await SERVICE_CALL(SERVICE_ARGUMENTS);
              return { RETURN_FIELD_NAME };
            }`,
            {
              INPUT_PARTS: `{ ${argNames.join(', ')} }`,
              CONTEXT: serviceOutput.requiresContext ? 'context' : '',
              RETURN_FIELD_NAME: returnFieldName,
              SERVICE_CALL: serviceOutput.expression,
              SERVICE_ARGUMENTS: TypescriptCodeUtils.mergeExpressions(
                serviceOutput.arguments.map((arg) =>
                  writeValueFromPothosArg(arg, tsUtils)
                ),
                ', '
              ).append(serviceOutput.requiresContext ? ', context' : ''),
            }
          );

          const fieldOptions = {
            input: inputFields.expression,
            payload: payloadFields.expression,
            ...customFields.value(),
            resolve: resolveFunction,
          };

          const block = TypescriptCodeUtils.formatBlock(
            `export const EXPORT_NAME = BUILDER.mutationField(NAME, (t) =>
            t.fieldWithInputPayload(OPTIONS)
          );`,
            {
              EXPORT_NAME: `${mutationName}Mutation`,
              BUILDER: 'builder',
              NAME: quot(mutationName),
              OPTIONS:
                TypescriptCodeUtils.mergeExpressionsAsObject(fieldOptions),
            }
          );

          pothosTypesFile.registerType({
            name: mutationName,
            block,
          });
        },
      };
    },
  })
);

const PothosPrismaCrudMutationGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    authorize: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/pothos/pothos-authorize-field',
      },
    },
  }),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default PothosPrismaCrudMutationGenerator;
