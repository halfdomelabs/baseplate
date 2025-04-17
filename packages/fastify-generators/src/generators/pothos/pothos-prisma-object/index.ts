import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import {
  projectScope,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { pothosTypeOutputProvider } from '@src/providers/pothos-type.js';
import { prismaToServiceOutputDto } from '@src/types/service-output.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import { writePothosExposeFieldFromDtoScalarField } from '@src/writers/pothos/index.js';

import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { pothosSchemaProvider } from '../pothos/pothos.generator.js';
import { pothosFieldScope } from '../providers/scopes.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  exposedFields: z.array(z.string().min(1)),
});

export interface PothosPrismaObjectProvider {
  addCustomField: (name: string, expression: TypescriptCodeExpression) => void;
}

export const pothosPrismaObjectProvider =
  createProviderType<PothosPrismaObjectProvider>('pothos-prisma-object');

export const pothosPrismaObjectGenerator = createGenerator({
  name: 'pothos/pothos-prisma-object',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({ modelName, exposedFields }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypeFile: pothosTypesFileProvider,
        pothosSchema: pothosSchemaProvider,
      },
      exports: {
        pothosPrismaObject: pothosPrismaObjectProvider.export(pothosFieldScope),
        pothosTypeOutput: pothosTypeOutputProvider.export(
          projectScope,
          `prisma-object-type:${modelName}`,
        ),
      },
      run({ prismaOutput, pothosTypeFile, pothosSchema }) {
        const model = prismaOutput.getPrismaModel(modelName);

        const exportName = `${lowerCaseFirst(model.name)}ObjectType`;

        const customFields = createNonOverwriteableMap<
          Record<string, TypescriptCodeExpression>
        >({});

        return {
          providers: {
            pothosPrismaObject: {
              addCustomField: (name, expression) => {
                customFields.set(name, expression);
              },
            },
            pothosTypeOutput: {
              getTypeReference: () => ({
                typeName: model.name,
                exportName,
                moduleName: pothosTypeFile.getModuleName(),
              }),
            },
          },
          build: () => {
            const outputDto = prismaToServiceOutputDto(model, (enumName) =>
              prismaOutput.getServiceEnum(enumName),
            );

            const typeReferences = pothosSchema.getTypeReferences();

            const missingField = exposedFields.find(
              (exposedFieldName) =>
                !outputDto.fields.some(
                  (field) => field.name === exposedFieldName,
                ),
            );

            if (missingField) {
              throw new Error(
                `Field ${missingField} not found in model ${model.name}`,
              );
            }

            const fieldDefinitions = outputDto.fields
              .filter((field) => exposedFields.includes(field.name))
              .map((field) => ({
                name: field.name,
                expression:
                  field.type === 'scalar'
                    ? writePothosExposeFieldFromDtoScalarField(field, {
                        schemaBuilder: 'builder',
                        fieldBuilder: 't',
                        typeReferences,
                      })
                    : `t.relation('${field.name}'${
                        field.isNullable ? ', { nullable: true }' : ''
                      })`,
              }));

            const objectTypeBlock = TypescriptCodeUtils.formatBlock(
              `export const OBJECT_TYPE_EXPORT = BUILDER.prismaObject(MODEL_NAME, {
              fields: (t) => (FIELDS)
            });`,
              {
                OBJECT_TYPE_EXPORT: exportName,
                BUILDER: pothosTypeFile.getBuilder(),
                MODEL_NAME: quot(model.name),
                FIELDS: TypescriptCodeUtils.mergeExpressionsAsObject({
                  ...Object.fromEntries(
                    fieldDefinitions.map((fieldDefinition) => [
                      fieldDefinition.name,
                      fieldDefinition.expression,
                    ]),
                  ),
                  ...customFields.value(),
                }),
              },
            );

            pothosTypeFile.registerType({
              block: objectTypeBlock,
              category: 'object-type',
            });
          },
        };
      },
    }),
  }),
});
