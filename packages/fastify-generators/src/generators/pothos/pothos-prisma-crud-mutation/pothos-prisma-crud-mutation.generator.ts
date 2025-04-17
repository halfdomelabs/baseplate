import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import {
  tsUtilsProvider,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { serviceFileOutputProvider } from '@src/generators/core/service-file/service-file.generator.js';
import { pothosFieldProvider } from '@src/providers/pothos-field.js';
import { pothosTypeOutputProvider } from '@src/providers/pothos-type.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import {
  writePothosInputFieldsFromDtoFields,
  writePothosSimpleObjectFieldsFromDtoFields,
} from '@src/writers/pothos/index.js';
import { writeValueFromPothosArg } from '@src/writers/pothos/resolvers.js';

import { pothosTypesFileProvider } from '../pothos-types-file/pothos-types-file.generator.js';
import { pothosSchemaProvider } from '../pothos/pothos.generator.js';
import { pothosFieldScope } from '../providers/scopes.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  type: z.enum(['create', 'update', 'delete']),
  crudServiceRef: z.string().min(1),
});

export const pothosPrismaCrudMutationGenerator = createGenerator({
  name: 'pothos/pothos-prisma-crud-mutation',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({ modelName, type, crudServiceRef }) => ({
    main: createGeneratorTask({
      dependencies: {
        pothosSchema: pothosSchemaProvider,
        pothosTypesFile: pothosTypesFileProvider,
        serviceFileOutput: serviceFileOutputProvider
          .dependency()
          .reference(crudServiceRef),
        tsUtils: tsUtilsProvider,
        pothosObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(`prisma-object-type:${modelName}`),
      },
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
          providers: {
            pothosField: {
              addCustomOption(field) {
                customFields.set(field.name, field.value);
              },
            },
          },
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
                SERVICE_ARGUMENTS: TypescriptCodeUtils.mergeExpressionsAsObject(
                  {
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
                  },
                ),
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
  }),
});
