import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { capitalize } from 'inflection';
import * as yup from 'yup';
import {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
  PrismaDataTransformInputField,
} from '@src/providers/prisma/prisma-data-transformable';
import { PrismaOutputRelationField } from '@src/types/prismaOutput';
import { scalarPrismaFieldToServiceField } from '@src/types/serviceOutput';
import { lowerCaseFirst } from '@src/utils/case';
import { prismaOutputProvider } from '../prisma';
import { prismaCrudServiceSetupProvider } from '../prisma-crud-service';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  inputName: yup.string(),
  localRelationName: yup.string(),
  embeddedFieldNames: yup.array().of(yup.string().required()),
  embeddedTransformerNames: yup.array().of(yup.string().required()),
});

const EmbeddedRelationTransformerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    prismaCrudServiceSetup: prismaCrudServiceSetupProvider,
  },
  createGenerator(
    {
      name: localRelationName,
      embeddedFieldNames = [],
      inputName: inputNameDescriptor,
    },
    { prismaOutput, prismaCrudServiceSetup }
  ) {
    function buildTransformer({
      isUpdate,
    }: PrismaDataTransformerOptions): PrismaDataTransformer {
      const modelName = prismaCrudServiceSetup.getModelName();
      const prismaModel = prismaOutput.getPrismaModel(modelName);
      const inputName = inputNameDescriptor || localRelationName;

      const relationField = prismaModel.fields.find(
        (f) => f.name === localRelationName
      );

      if (!relationField || relationField.type !== 'relation') {
        throw new Error(
          `${modelName}.${localRelationName} is not a relation field`
        );
      }

      // find the relationship on the foreign model since that's where the details of the relation exist
      const foreignModel = prismaOutput.getPrismaModel(relationField.modelType);
      const foreignRelation = foreignModel.fields.find(
        (f): f is PrismaOutputRelationField =>
          f.type === 'relation' &&
          (relationField.relationName
            ? f.name === relationField.relationName
            : f.modelType === modelName)
      );

      if (!foreignRelation) {
        throw new Error(
          `Could not find foreign relation on ${relationField.modelType} for ${modelName}.${localRelationName}`
        );
      }

      const pickSelection = embeddedFieldNames.map((f) => `'${f}'`).join(' | ');
      const embeddedFields = embeddedFieldNames.map((name) => {
        const field = foreignModel.fields.find((f) => f.name === name);
        if (!field) {
          throw new Error(
            `Could not find field ${name} on ${foreignModel.name}`
          );
        }
        if (field.type !== 'scalar') {
          throw new Error(
            `Field ${name} on ${foreignModel.name} is not a scalar`
          );
        }
        return field;
      });

      const inputField: PrismaDataTransformInputField = {
        type: TypescriptCodeUtils.createExpression(
          `Pick<Prisma.${foreignModel.name}UncheckedCreateInput, ${pickSelection}>[]`,
          'import { Prisma } from "@prisma/client";'
        ),
        dtoField: {
          name: inputName,
          isOptional: true,
          type: 'nested',
          isList: true,
          nestedType: {
            name: `${foreignModel.name}CreateDataWithout${capitalize(
              foreignRelation.name
            )}Data`,
            fields: embeddedFields.map((field) =>
              scalarPrismaFieldToServiceField(field)
            ),
          },
        },
      };

      let transformer: TypescriptCodeBlock;

      if (!isUpdate) {
        transformer = TypescriptCodeUtils.createBlock(
          `const ${localRelationName}Data = ${inputName} && { createMany: { data: ${inputName} } };`
        );
      } else {
        if (!foreignModel.idFields) {
          throw new Error(`${foreignModel.name} does not have id fields`);
        }
        if (foreignModel.idFields.length !== 2) {
          // TODO: Support more fields
          throw new Error(
            `${foreignModel.name} does not have exactly 2 id fields`
          );
        }
        const primaryIdsNotInLocal = foreignModel.idFields.filter(
          (id) => !foreignRelation.fields?.includes(id)
        );
        if (primaryIdsNotInLocal.length !== 1) {
          throw new Error(
            `Need exactly one primary key that is not part of relation ${foreignRelation.name} in ${foreignModel.name}`
          );
        }
        const primaryIdNotInLocal = primaryIdsNotInLocal[0];

        if (!embeddedFieldNames.includes(primaryIdNotInLocal)) {
          throw new Error(
            `Foreign relation ${foreignRelation.name} in ${foreignModel.name} references ${primaryIdNotInLocal} which must be present in embedded fields`
          );
        }

        const foreignVar = lowerCaseFirst(foreignModel.name);

        const primaryKeyName = foreignModel.idFields.join('_');

        transformer = TypescriptCodeUtils.createBlock(
          `const ${localRelationName}Data: Prisma.${
            foreignModel.name
          }UpdateManyWithout${capitalize(
            foreignRelation.name
          )}Input | undefined =
  ${inputName} && {
    deleteMany: {
      ${primaryIdNotInLocal}: { notIn: ${inputName}.map(${foreignVar} => ${foreignVar}.${primaryIdNotInLocal}) },
    },
    upsert: ${inputName}.map(${foreignVar} => ({
      where: { ${primaryKeyName}: { ${
            foreignRelation?.fields?.[0] || ''
          }: id, ${primaryIdNotInLocal}: ${foreignVar}.${primaryIdNotInLocal}} },
      update: ${foreignVar},
      create: ${foreignVar}
    }))
  }
        `
        );
      }

      return {
        inputFields: [inputField],
        outputFields: [
          {
            name: localRelationName,
            outputVariableName: `${localRelationName}Data`,
          },
        ],
        transformer,
      };
    }

    prismaCrudServiceSetup.addTransformer(localRelationName, {
      buildTransformer,
    });

    return {
      build: async () => {},
    };
  },
});

export default EmbeddedRelationTransformerGenerator;
