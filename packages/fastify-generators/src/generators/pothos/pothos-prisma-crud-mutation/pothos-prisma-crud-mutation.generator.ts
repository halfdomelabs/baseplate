import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsUtilsImportsProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
} from '@baseplate-dev/sync';
import { quot, sortObjectKeys } from '@baseplate-dev/utils';
import { z } from 'zod';

import type { ServiceOutputDtoInjectedArg } from '#src/types/service-output.js';

import { serviceFileOutputProvider } from '#src/generators/core/service-file/index.js';
import {
  pothosFieldProvider,
  pothosTypeOutputProvider,
} from '#src/generators/pothos/_providers/index.js';
import { getPrimaryKeyDefinition } from '#src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaOutputProvider } from '#src/generators/prisma/index.js';
import {
  contextKind,
  prismaQueryKind,
  prismaWhereUniqueInputKind,
} from '#src/types/service-dto-kinds.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import {
  writePothosInputFieldsFromDtoFields,
  writePothosSimpleObjectFieldsFromDtoFields,
} from '#src/writers/pothos/index.js';
import { writeValueFromPothosArg } from '#src/writers/pothos/resolvers.js';

import { pothosFieldScope } from '../_providers/scopes.js';
import { createPothosPrismaObjectTypeOutputName } from '../pothos-prisma-object/index.js';
import { getPothosPrismaPrimaryKeyTypeOutputName } from '../pothos-prisma-primary-key/index.js';
import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { pothosSchemaBaseTypesProvider } from '../pothos/index.js';

const descriptorSchema = z.object({
  /**
   * The name of the model.
   */
  modelName: z.string().min(1),
  /**
   * The name of the mutation.
   */
  name: z.string().min(1),
  /**
   * The reference to the crud service.
   */
  crudServiceRef: z.string().min(1),
  /**
   * The order of the type in the types file.
   */
  order: z.number(),
});

type InjectedArgRequirements = 'context' | 'info' | 'id';

/**
 * Handles injected service arguments by generating the appropriate code fragments.
 * Injected arguments are provided by the framework (context, query, where/id mapping).
 */
function handleInjectedArg(
  arg: ServiceOutputDtoInjectedArg,
  context: { returnFieldName: string },
): { fragment: TsCodeFragment; requirements: InjectedArgRequirements[] } {
  switch (arg.kind) {
    case contextKind: {
      // expect context
      return { fragment: tsCodeFragment('context'), requirements: ['context'] };
    }

    case prismaQueryKind: {
      // expect context and info
      return {
        fragment: TsCodeUtils.formatFragment(
          'queryFromInfo({ context, info, path: PATH })',
          { PATH: `[${quot(context.returnFieldName)}]` },
          tsImportBuilder(['queryFromInfo']).from('@pothos/plugin-prisma'),
        ),
        requirements: ['context', 'info'],
      };
    }

    case prismaWhereUniqueInputKind: {
      // expect id
      const typedArg = arg as ServiceOutputDtoInjectedArg<
        typeof prismaWhereUniqueInputKind
      >;
      const { idFields } = typedArg.metadata;
      return {
        fragment:
          idFields.length === 1
            ? TsCodeUtils.mergeFragmentsAsObject({
                [idFields[0]]: 'id',
              })
            : TsCodeUtils.mergeFragmentsAsObject({
                [idFields.join('_')]: 'id',
              }),
        requirements: ['id'],
      };
    }

    default: {
      throw new Error(`Unknown injected argument kind: ${arg.kind.name}`);
    }
  }
}

export const pothosPrismaCrudMutationGenerator = createGenerator({
  name: 'pothos/pothos-prisma-crud-mutation',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({ modelName, name, crudServiceRef, order }) => ({
    main: createGeneratorTask({
      dependencies: {
        pothosSchemaBaseTypes: pothosSchemaBaseTypesProvider,
        pothosTypesFile: pothosTypesFileProvider,
        prismaOutput: prismaOutputProvider,
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
            getPothosPrismaPrimaryKeyTypeOutputName(modelName),
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
        prismaOutput,
      }) {
        const serviceOutput = serviceFileOutput.getServiceMethod(name);
        const prismaModel = prismaOutput.getPrismaModel(modelName);
        const typeReferences = [
          pothosObjectType.getTypeReference(),
          pothosPrimaryKeyInputType?.getTypeReference(),
        ].filter((x) => x !== undefined);

        const customFields = createNonOverwriteableMap<
          Record<string, TsCodeFragment>
        >({});
        const returnFieldName = lowerCaseFirst(modelName);

        const serviceArgs = serviceOutput.arguments;
        const injectedArgs = serviceArgs
          .filter((arg) => arg.type === 'injected')
          .map((arg) => handleInjectedArg(arg, { returnFieldName }));
        const argRequirements = new Set(
          injectedArgs.flatMap((arg) => arg.requirements),
        );
        const nonInjectedArgs = serviceArgs.filter(
          (arg) => arg.type === 'scalar' || arg.type === 'nested',
        );

        const inputArgs = [
          argRequirements.has('id')
            ? getPrimaryKeyDefinition(prismaModel)
            : undefined,
          ...nonInjectedArgs,
        ].filter((x) => x !== undefined);
        const inputFields = writePothosInputFieldsFromDtoFields(inputArgs, {
          pothosSchemaBaseTypes,
          typeReferences,
          schemaBuilder: pothosTypesFile.getBuilderFragment(),
          fieldBuilder: 't.input',
        });

        return {
          providers: {
            pothosField: {
              addCustomOption(field) {
                customFields.set(field.name, field.value);
              },
            },
          },
          build: () => {
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

            const argNames = inputArgs.map((arg) => arg.name);

            const resolveFunctionArgs = [
              'root',
              `{ input: { ${argNames.join(', ')} } }`,
              argRequirements.has('context') || argRequirements.has('info')
                ? 'context'
                : undefined,
              argRequirements.has('info') ? 'info' : undefined,
            ]
              .filter((x) => x !== undefined)
              .join(', ');

            const resolveFunction = TsCodeUtils.formatFragment(
              `async (ARGS) => {
              const RETURN_FIELD_NAME = await SERVICE_CALL(SERVICE_ARGUMENTS);
              return { RETURN_FIELD_NAME };
            }`,
              {
                ARGS: resolveFunctionArgs,
                RETURN_FIELD_NAME: returnFieldName,
                SERVICE_CALL: serviceOutput.referenceFragment,
                SERVICE_ARGUMENTS: TsCodeUtils.mergeFragmentsAsObject(
                  Object.fromEntries(
                    serviceArgs.map((arg) => [
                      arg.name,
                      arg.type === 'injected'
                        ? handleInjectedArg(arg, { returnFieldName }).fragment
                        : writeValueFromPothosArg(arg, tsUtilsImports),
                    ]),
                  ),
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
                NAME: quot(name),
                OPTIONS: TsCodeUtils.mergeFragmentsAsObject(fieldOptions, {
                  disableSort: true,
                }),
              },
            );

            pothosTypesFile.typeDefinitions.add({
              name,
              fragment: mutationFragment,
              order,
            });
          },
        };
      },
    }),
  }),
});
