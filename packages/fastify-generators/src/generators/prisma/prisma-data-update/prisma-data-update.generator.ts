import {
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import {
  lowercaseFirstChar,
  quot,
  uppercaseFirstChar,
} from '@baseplate-dev/utils';
import { z } from 'zod';

import { serviceFileProvider } from '#src/generators/core/index.js';
import {
  contextKind,
  prismaQueryKind,
  prismaWhereUniqueInputKind,
} from '#src/types/service-dto-kinds.js';
import {
  createServiceOutputDtoInjectedArg,
  prismaToServiceOutputDto,
} from '#src/types/service-output.js';

import { generateUpdateExecuteCallback } from '../_shared/build-data-helpers/index.js';
import { dataUtilsImportsProvider } from '../data-utils/index.js';
import { prismaDataServiceProvider } from '../prisma-data-service/prisma-data-service.generator.js';
import {
  prismaImportsProvider,
  prismaOutputProvider,
} from '../prisma/index.js';

const descriptorSchema = z.object({
  name: z.string().min(1),
  modelName: z.string().min(1),
  fields: z.array(z.string().min(1)),
});

/**
 * Generator for prisma/prisma-data-update
 */
export const prismaDataUpdateGenerator = createGenerator({
  name: 'prisma/prisma-data-update',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ name, modelName, fields }) => ({
    main: createGeneratorTask({
      dependencies: {
        serviceFile: serviceFileProvider,
        prismaDataService: prismaDataServiceProvider,
        dataUtilsImports: dataUtilsImportsProvider,
        prismaOutput: prismaOutputProvider,
        prismaImports: prismaImportsProvider,
      },
      run({
        serviceFile,
        prismaDataService,
        dataUtilsImports,
        prismaOutput,
        prismaImports,
      }) {
        const serviceFields = prismaDataService.getFields();
        const usedFields = serviceFields.filter((field) =>
          fields.includes(field.name),
        );
        if (usedFields.length !== fields.length) {
          throw new Error(
            `Fields ${fields.filter((field) => !usedFields.some((f) => f.name === field)).join(', ')} not found in service fields`,
          );
        }
        return {
          build: () => {
            const fieldsFragment =
              fields.length === serviceFields.length
                ? prismaDataService.getFieldsVariableName()
                : tsTemplateWithImports([
                    tsImportBuilder(['pick']).from('es-toolkit'),
                  ])`pick(${prismaDataService.getFieldsVariableName()}, [${fields.map((field) => quot(field)).join(', ')}] as const)`;

            const modelVar = lowercaseFirstChar(modelName);

            // Generate execute callback that transforms FK fields into relations
            const { executeCallbackFragment } = generateUpdateExecuteCallback({
              prismaModel: prismaOutput.getPrismaModel(modelName),
              inputFieldNames: fields,
              dataUtilsImports,
              modelVariableName: modelVar,
            });

            // Generate the schema export and update function together
            const schemaName = `${modelVar}UpdateSchema`;

            const updateFunction = tsTemplate`
              export const ${schemaName} = ${dataUtilsImports.generateUpdateSchema.fragment()}(${fieldsFragment});

              export async function ${name}<
                TQueryArgs extends ${dataUtilsImports.ModelQuery.typeFragment()}<${quot(modelVar)}> = ${dataUtilsImports.ModelQuery.typeFragment()}<${quot(modelVar)}>,
              >({
                where,
                data: input,
                query,
                context,
              }: ${dataUtilsImports.DataUpdateInput.typeFragment()}<
                ${quot(modelVar)},
                typeof ${fieldsFragment},
                TQueryArgs
              >): Promise<${dataUtilsImports.GetPayload.typeFragment()}<${quot(modelVar)}, TQueryArgs>> {
                const plan = await ${dataUtilsImports.composeUpdate.fragment()}({
                  model: ${quot(modelVar)},
                  fields: ${fieldsFragment},
                  input,
                  context,
                  loadExisting: () => ${prismaImports.prisma.fragment()}.${modelVar}.findUniqueOrThrow({ where }),
                });

                return ${dataUtilsImports.commitUpdate.fragment()}(plan, {
                  query,
                  execute: ${executeCallbackFragment},
                });
              }
            `;

            const prismaModel = prismaOutput.getPrismaModel(modelName);

            const methodFragment = TsCodeUtils.importFragment(
              name,
              serviceFile.getServicePath(),
            );

            const schemaMethodFragment = TsCodeUtils.importFragment(
              schemaName,
              serviceFile.getServicePath(),
            );

            prismaDataService.registerMethod({
              name,
              type: 'update',
              fragment: updateFunction,
              outputMethod: {
                name,
                referenceFragment: methodFragment,
                arguments: [
                  createServiceOutputDtoInjectedArg({
                    type: 'injected',
                    name: 'where',
                    kind: prismaWhereUniqueInputKind,
                    metadata: {
                      idFields: prismaModel.idFields ?? [],
                    },
                  }),
                  {
                    name: 'data',
                    type: 'nested',
                    nestedType: {
                      name: `${uppercaseFirstChar(name)}Data`,
                      fields: usedFields.map((field) => ({
                        ...field.outputDtoField,
                        isOptional: true,
                      })),
                    },
                    zodSchemaFragment: schemaMethodFragment,
                  },
                  createServiceOutputDtoInjectedArg({
                    type: 'injected',
                    name: 'context',
                    kind: contextKind,
                  }),
                  createServiceOutputDtoInjectedArg({
                    type: 'injected',
                    name: 'query',
                    kind: prismaQueryKind,
                  }),
                ],
                returnType: prismaToServiceOutputDto(prismaModel, (enumName) =>
                  prismaOutput.getServiceEnum(enumName),
                ),
              },
            });
          },
        };
      },
    }),
  }),
});
