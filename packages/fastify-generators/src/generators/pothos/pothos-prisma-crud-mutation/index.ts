import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import {
  quot,
  tsUtilsProvider,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { serviceFileOutputProvider } from '@src/generators/core/service-file/index.js';
import { pothosFieldProvider } from '@src/providers/pothos-field.js';
import { pothosTypeOutputProvider } from '@src/providers/pothos-type.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import {
  writePothosInputFieldsFromDtoFields,
  writePothosSimpleObjectFieldsFromDtoFields,
} from '@src/writers/pothos/index.js';
import { writeValueFromPothosArg } from '@src/writers/pothos/resolvers.js';

import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { pothosSchemaProvider } from '../pothos/index.js';
import { pothosFieldScope } from '../providers/scopes.js';

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
    scopes: [pothosFieldScope],
    exports: {
      pothosField: pothosFieldProvider.export(pothosFieldScope),
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

      // unwrap input object arguments
      const unwrappedArguments = serviceOutput.arguments.flatMap((arg) => {
        if (
          arg.name === 'input' &&
          arg.type === 'nested' &&
          !arg.isPrismaType
        ) {
          return arg.nestedType.fields;
        }
        return [arg];
      });

      const inputArgument =
        serviceOutput.arguments.length > 0
          ? serviceOutput.arguments[0]
          : undefined;

      if (
        !inputArgument ||
        inputArgument.name !== 'input' ||
        inputArgument.type !== 'nested' ||
        inputArgument.isPrismaType
      ) {
        throw new Error('Expected input argument to be a nested object');
      }

      const inputFields = writePothosInputFieldsFromDtoFields(
        inputArgument.nestedType.fields,
        {
          typeReferences,
          schemaBuilder: 'builder',
          fieldBuilder: 't.input',
        },
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
          if (inputFields.childDefinitions)
            for (const childDefinition of inputFields.childDefinitions) {
              pothosTypesFile.registerType({
                name: childDefinition.name,
                block: childDefinition.definition,
              });
            }

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
                pothosObjectType.getTypeReference(),
              ),
              schemaBuilder: 'builder',
              fieldBuilder: 't.payload',
            },
          );

          const argNames = inputArgument.nestedType.fields.map(
            (arg) => arg.name,
          );

          const resolveFunction = TypescriptCodeUtils.formatExpression(
            `async (root, { input: INPUT_PARTS }, context, info) => {
              const RETURN_FIELD_NAME = await SERVICE_CALL(SERVICE_ARGUMENTS);
              return { RETURN_FIELD_NAME };
            }`,
            {
              INPUT_PARTS: `{ ${argNames.join(', ')} }`,
              CONTEXT: serviceOutput.requiresContext ? 'context' : '',
              RETURN_FIELD_NAME: returnFieldName,
              SERVICE_CALL: serviceOutput.expression,
              SERVICE_ARGUMENTS: TypescriptCodeUtils.mergeExpressionsAsObject({
                ...Object.fromEntries(
                  unwrappedArguments.map((arg) => [
                    arg.name,
                    writeValueFromPothosArg(arg, tsUtils),
                  ]),
                ),
                context: 'context',
                query: TypescriptCodeUtils.formatExpression(
                  'queryFromInfo({ context, info, path: PATH })',
                  {
                    PATH: `['${returnFieldName}']`,
                  },
                  {
                    importText: [
                      `import { queryFromInfo } from '@pothos/plugin-prisma';`,
                    ],
                  },
                ),
              }),
            },
          );

          const fieldOptions = {
            input: inputFields.expression,
            payload: payloadFields.expression,
            ...customFields.value(),
            resolve: resolveFunction,
          };

          const block = TypescriptCodeUtils.formatBlock(
            `BUILDER.mutationField(NAME, (t) =>
            t.fieldWithInputPayload(OPTIONS)
          );`,
            {
              BUILDER: 'builder',
              NAME: quot(mutationName),
              OPTIONS:
                TypescriptCodeUtils.mergeExpressionsAsObject(fieldOptions),
            },
          );

          pothosTypesFile.registerType({
            name: mutationName,
            block,
          });
        },
      };
    },
  }),
);

const PothosPrismaCrudMutationGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    authorize: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/pothos/pothos-authorize-field',
      },
    },
  }),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default PothosPrismaCrudMutationGenerator;
