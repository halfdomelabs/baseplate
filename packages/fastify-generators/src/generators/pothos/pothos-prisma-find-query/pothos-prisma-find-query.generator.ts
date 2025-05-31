import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
} from '@baseplate-dev/sync';
import { quot, sortObjectKeys } from '@baseplate-dev/utils';
import { z } from 'zod';

import type { PothosWriterOptions } from '#src/writers/pothos/index.js';

import {
  pothosFieldProvider,
  pothosTypeOutputProvider,
} from '#src/generators/pothos/_providers/index.js';
import {
  getModelIdFieldName,
  getPrimaryKeyDefinition,
} from '#src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaOutputProvider } from '#src/generators/prisma/prisma/prisma.generator.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import { writePothosArgsFromDtoFields } from '#src/writers/pothos/index.js';

import { pothosFieldScope } from '../_providers/scopes.js';
import { getPothosPrismaPrimaryKeyTypeOutputName } from '../pothos-prisma-primary-key/pothos-prisma-primary-key.generator.js';
import { pothosTypesFileProvider } from '../pothos-types-file/pothos-types-file.generator.js';
import { pothosSchemaBaseTypesProvider } from '../pothos/pothos.generator.js';

const descriptorSchema = z.object({
  /**
   * The name of the model.
   */
  modelName: z.string().min(1),
  /**
   * The order of the type in the types file.
   */
  order: z.number(),
  /**
   * Whether the model has a primary key input type.
   */
  hasPrimaryKeyInputType: z.boolean(),
});

export const pothosPrismaFindQueryGenerator = createGenerator({
  name: 'pothos/pothos-prisma-find-query',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({ modelName, order, hasPrimaryKeyInputType }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypesFile: pothosTypesFileProvider,
        pothosSchemaBaseTypes: pothosSchemaBaseTypesProvider,
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
        prismaOutput,
        pothosSchemaBaseTypes,
        pothosTypesFile,
        pothosPrimaryKeyInputType,
      }) {
        const modelOutput = prismaOutput.getPrismaModel(modelName);

        const { idFields } = modelOutput;

        if (!idFields) {
          throw new Error(`Model ${modelName} does not have an ID field`);
        }

        const primaryKeyDefinition = getPrimaryKeyDefinition(modelOutput);

        const writerOptions: PothosWriterOptions = {
          schemaBuilder: pothosTypesFile.getBuilderFragment(),
          fieldBuilder: 't',
          pothosSchemaBaseTypes,
          typeReferences: pothosPrimaryKeyInputType
            ? [pothosPrimaryKeyInputType.getTypeReference()]
            : undefined,
        };

        const lowerFirstModelName = lowerCaseFirst(modelName);

        const customFields = createNonOverwriteableMap<
          Record<string, TsCodeFragment>
        >({});

        return {
          providers: {
            pothosField: {
              addCustomOption(field) {
                customFields.set(field.name, field.value);
              },
            },
          },
          build: () => {
            const pothosArgs = writePothosArgsFromDtoFields(
              [primaryKeyDefinition],
              writerOptions,
            );

            const primaryKeyFieldName = getModelIdFieldName(modelOutput);

            const resolveFunction = TsCodeUtils.formatFragment(
              `async (query, root, ARG_INPUT) => MODEL.findUniqueOrThrow({...query,where: WHERE_CLAUSE})`,
              {
                ARG_INPUT: `{ ${primaryKeyDefinition.name} }`,
                MODEL: prismaOutput.getPrismaModelFragment(modelName),
                WHERE_CLAUSE:
                  primaryKeyFieldName === primaryKeyDefinition.name
                    ? `{ ${primaryKeyFieldName} }`
                    : `{ ${primaryKeyFieldName}: ${primaryKeyDefinition.name} }`,
              },
            );

            const options = {
              type: quot(modelName),
              ...sortObjectKeys(customFields.value()),
              args: pothosArgs,
              resolve: resolveFunction,
            };

            const block = TsCodeUtils.formatFragment(
              `BUILDER.queryField(QUERY_NAME, (t) => 
          t.prismaField(OPTIONS)
        );`,
              {
                QUERY_EXPORT: `${lowerFirstModelName}Query`,
                BUILDER: 'builder',
                QUERY_NAME: quot(lowerFirstModelName),
                OPTIONS: TsCodeUtils.mergeFragmentsAsObject(options, {
                  disableSort: true,
                }),
              },
            );

            pothosTypesFile.typeDefinitions.add({
              name: `${lowerFirstModelName}Query`,
              fragment: block,
              order,
            });
          },
        };
      },
    }),
  }),
});
