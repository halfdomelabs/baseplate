import {
  quot,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { pothosTypeOutputProvider } from '@src/providers/pothos-type';
import { prismaToServiceOutputDto } from '@src/types/serviceOutput';
import { lowerCaseFirst } from '@src/utils/case';
import { writePothosExposeFieldFromDtoScalarField } from '@src/writers/pothos';
import { pothosSchemaProvider } from '../pothos';
import { pothosTypesFileProvider } from '../pothos-types-file';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  exposedFields: z.array(z.string().min(1)),
});

type Descriptor = z.infer<typeof descriptorSchema>;

export interface PothosPrismaObjectProvider {
  addCustomField: (name: string, expression: TypescriptCodeExpression) => void;
}

export const pothosPrismaObjectProvider =
  createProviderType<PothosPrismaObjectProvider>('pothos-prisma-object');

const createMainTask = createTaskConfigBuilder(
  ({ modelName, exposedFields }: Descriptor) => ({
    name: 'main',
    dependencies: {
      prismaOutput: prismaOutputProvider,
      pothosTypeFile: pothosTypesFileProvider,
      pothosSchema: pothosSchemaProvider,
    },
    exports: {
      pothosPrismaObject: pothosPrismaObjectProvider,
      pothosTypeOutput: pothosTypeOutputProvider,
    },
    run({ prismaOutput, pothosTypeFile, pothosSchema }) {
      const model = prismaOutput.getPrismaModel(modelName);

      const exportName = `${lowerCaseFirst(model.name)}ObjectType`;

      const customFields = createNonOverwriteableMap<
        Record<string, TypescriptCodeExpression>
      >({});

      return {
        getProviders: () => ({
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
        }),
        build: () => {
          const outputDto = prismaToServiceOutputDto(model, (enumName) =>
            prismaOutput.getServiceEnum(enumName)
          );

          const typeReferences = pothosSchema.getTypeReferences();

          const missingField = exposedFields.find(
            (exposedFieldName) =>
              !outputDto.fields.some((field) => field.name === exposedFieldName)
          );

          if (missingField) {
            throw new Error(
              `Field ${missingField} not found in model ${model.name}`
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
                  ])
                ),
                ...customFields.value(),
              }),
            }
          );

          pothosTypeFile.registerType({
            block: objectTypeBlock,
            category: 'object-type',
          });
        },
      };
    },
  })
);

const PothosPrismaObjectGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default PothosPrismaObjectGenerator;
