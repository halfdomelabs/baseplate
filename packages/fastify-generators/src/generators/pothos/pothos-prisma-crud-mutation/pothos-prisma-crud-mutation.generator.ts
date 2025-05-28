import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  TsCodeUtils,
  tsImportBuilder,
  tsUtilsImportsProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
} from '@halfdomelabs/sync';
import { quot, sortObjectKeys } from '@halfdomelabs/utils';
import { z } from 'zod';

import { serviceFileOutputProvider } from '#src/generators/core/service-file/service-file.generator.js';
import {
  pothosFieldProvider,
  pothosTypeOutputProvider,
} from '#src/generators/pothos/_providers/index.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import {
  writePothosInputFieldsFromDtoFields,
  writePothosSimpleObjectFieldsFromDtoFields,
} from '#src/writers/pothos/index.js';
import { writeValueFromPothosArg } from '#src/writers/pothos/resolvers.js';

import { pothosFieldScope } from '../_providers/scopes.js';
import { createPothosPrismaObjectTypeOutputName } from '../pothos-prisma-object/pothos-prisma-object.generator.js';
import { getPothosPrismaPrimaryKeyTypeOutputName } from '../pothos-prisma-primary-key/pothos-prisma-primary-key.generator.js';
import { pothosTypesFileProvider } from '../pothos-types-file/pothos-types-file.generator.js';
import { pothosSchemaBaseTypesProvider } from '../pothos/pothos.generator.js';

const descriptorSchema = z.object({
  /**
   * The name of the model.
   */
  modelName: z.string().min(1),
  /**
   * The type of the mutation.
   */
  type: z.enum(['create', 'update', 'delete']),
  /**
   * The reference to the crud service.
   */
  crudServiceRef: z.string().min(1),
  /**
   * The order of the type in the types file.
   */
  order: z.number(),
  /**
   * Whether the mutation has a primary key input type.
   */
  hasPrimaryKeyInputType: z.boolean(),
});

export const pothosPrismaCrudMutationGenerator = createGenerator({
  name: 'pothos/pothos-prisma-crud-mutation',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({
    modelName,
    type,
    crudServiceRef,
    order,
    hasPrimaryKeyInputType,
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        pothosSchemaBaseTypes: pothosSchemaBaseTypesProvider,
        pothosTypesFile: pothosTypesFileProvider,
        serviceFileOutput: serviceFileOutputProvider
          .dependency()
          .reference(crudServiceRef),
        tsUtilsImports: tsUtilsImportsProvider,
        pothosObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(createPothosPrismaObjectTypeOutputName(modelName)),
        pothosPrimaryKeyInputType: pothosTypeOutputProvider
          .dependency()
          .optionalReference(
            hasPrimaryKeyInputType
              ? getPothosPrismaPrimaryKeyTypeOutputName(modelName)
              : undefined,
          ),
      },
      exports: {
        pothosField: pothosFieldProvider.export(pothosFieldScope),
      },
      run({
        pothosSchemaBaseTypes,
        pothosTypesFile,
        serviceFileOutput,
        tsUtilsImports,
        pothosObjectType,
        pothosPrimaryKeyInputType,
      }) {
        const serviceOutput = serviceFileOutput.getServiceMethod(type);
        const typeReferences = [
          pothosObjectType.getTypeReference(),
          pothosPrimaryKeyInputType?.getTypeReference(),
        ].filter((x) => x !== undefined);

        const mutationName = `${type}${modelName}`;

        const customFields = createNonOverwriteableMap<
          Record<string, TsCodeFragment>
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
            pothosSchemaBaseTypes,
            typeReferences,
            schemaBuilder: pothosTypesFile.getBuilderFragment(),
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
                pothosSchemaBaseTypes,
                typeReferences,
                schemaBuilder: pothosTypesFile.getBuilderFragment(),
                fieldBuilder: 't.payload',
              },
            );

            const argNames = inputArgument.nestedType.fields.map(
              (arg) => arg.name,
            );

            const resolveFunction = TsCodeUtils.formatFragment(
              `async (root, { input: INPUT_PARTS }, context, info) => {
              const RETURN_FIELD_NAME = await SERVICE_CALL(SERVICE_ARGUMENTS);
              return { RETURN_FIELD_NAME };
            }`,
              {
                INPUT_PARTS: `{ ${argNames.join(', ')} }`,
                CONTEXT: serviceOutput.requiresContext ? 'context' : '',
                RETURN_FIELD_NAME: returnFieldName,
                SERVICE_CALL: serviceOutput.referenceFragment,
                SERVICE_ARGUMENTS: TsCodeUtils.mergeFragmentsAsObject(
                  {
                    ...Object.fromEntries(
                      unwrappedArguments.map((arg) => [
                        arg.name,
                        writeValueFromPothosArg(arg, tsUtilsImports),
                      ]),
                    ),
                    context: 'context',
                    query: TsCodeUtils.formatFragment(
                      'queryFromInfo({ context, info, path: PATH })',
                      {
                        PATH: `[${quot(returnFieldName)}]`,
                      },
                      tsImportBuilder(['queryFromInfo']).from(
                        '@pothos/plugin-prisma',
                      ),
                    ),
                  },
                  { disableSort: true },
                ),
              },
            );

            const fieldOptions = {
              input: inputFields,
              payload: payloadFields,
              ...sortObjectKeys(customFields.value()),
              resolve: resolveFunction,
            };

            const mutationFragment = TsCodeUtils.formatFragment(
              `BUILDER.mutationField(NAME, (t) =>
            t.fieldWithInputPayload(OPTIONS)
          );`,
              {
                BUILDER: pothosTypesFile.getBuilderFragment(),
                NAME: quot(mutationName),
                OPTIONS: TsCodeUtils.mergeFragmentsAsObject(fieldOptions, {
                  disableSort: true,
                }),
              },
            );

            pothosTypesFile.typeDefinitions.add({
              name: mutationName,
              fragment: mutationFragment,
              order,
            });
          },
        };
      },
    }),
  }),
});
