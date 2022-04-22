import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import {
  PrismaDataTransformer,
  PrismaDataTransformerOptions,
  PrismaDataTransformInputField,
} from '@src/providers/prisma/prisma-data-transformable';
import {
  PrismaOutputModel,
  PrismaOutputRelationField,
} from '@src/types/prismaOutput';
import { scalarPrismaFieldToServiceField } from '@src/types/serviceOutput';
import { lowerCaseFirst, upperCaseFirst } from '@src/utils/case';
import {
  getDataInputTypeBlock,
  PrismaDataMethodOptions,
} from '../_shared/crud-method/data-method';
import { PrismaOutputProvider, prismaOutputProvider } from '../prisma';
import { prismaCrudServiceSetupProvider } from '../prisma-crud-service';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  inputName: yup.string(),
  localRelationName: yup.string(),
  embeddedFieldNames: yup.array().of(yup.string().required()),
  embeddedTransformerNames: yup.array().of(yup.string().required()),
});

function getForeignModelRelation(
  prismaOutput: PrismaOutputProvider,
  modelName: string,
  localRelationName: string
): {
  localModel: PrismaOutputModel;
  foreignModel: PrismaOutputModel;
  localRelation: PrismaOutputRelationField;
  foreignRelation: PrismaOutputRelationField;
} {
  const localModel = prismaOutput.getPrismaModel(modelName);
  const localRelation = localModel.fields.find(
    (f) => f.name === localRelationName
  );

  if (!localRelation || localRelation.type !== 'relation') {
    throw new Error(
      `${modelName}.${localRelationName} is not a relation field`
    );
  }

  // find the relationship on the foreign model since that's where the details of the relation exist
  const foreignModel = prismaOutput.getPrismaModel(localRelation.modelType);
  const foreignRelation = foreignModel.fields.find(
    (f): f is PrismaOutputRelationField =>
      f.type === 'relation' &&
      (localRelation.relationName
        ? f.name === localRelation.relationName
        : f.modelType === modelName)
  );

  if (!foreignRelation) {
    throw new Error(
      `Could not find foreign relation on ${localRelation.modelType} for ${modelName}.${localRelationName}`
    );
  }

  return { localModel, foreignModel, localRelation, foreignRelation };
}

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
      const inputName = inputNameDescriptor || localRelationName;

      const { localModel, foreignModel, localRelation, foreignRelation } =
        getForeignModelRelation(prismaOutput, modelName, localRelationName);

      if (localModel.idFields?.length !== 1) {
        throw new Error(
          `${modelName} must have exactly one id field if used in an embedded relation`
        );
      }
      const localId = localModel.idFields[0];

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

      const dataMethodOptions: Omit<PrismaDataMethodOptions, 'name'> = {
        modelName: foreignModel.name,
        prismaFieldNames: embeddedFields.map((f) => f.name),
        operationName: 'create',
        transformers: [],
        prismaOutput,
        isPartial: false,
      };

      const dataInputName = `${modelName}Embedded${upperCaseFirst(
        localRelationName
      )}Data`;
      const dataInputType = getDataInputTypeBlock(
        dataInputName,
        dataMethodOptions
      ).withHeaderKey(dataInputName);

      const inputField: PrismaDataTransformInputField = {
        type: TypescriptCodeUtils.createExpression(
          `${dataInputName}${localRelation.isList ? '[]' : ''}`,
          undefined,
          {
            headerBlocks: [dataInputType],
          }
        ),
        dtoField: {
          name: inputName,
          isOptional: true,
          type: 'nested',
          isList: localRelation.isList,
          nestedType: {
            name: dataInputName,
            fields: embeddedFields.map((field) =>
              scalarPrismaFieldToServiceField(field)
            ),
          },
        },
      };

      /**
       * This is a fairly complex piece of logic. We have the following scenarios:
       *
       * Update/Create:
       *  - Update operation
       *  - Create operation
       *
       * Primary Key:
       *  - Compound key w/ one ID field being present in foreign relation
       *  - Single ID field not present in foreign relation (e.g. independent id field like TodoList and Todo items)
       *  - Single ID field present in foreign relation (1:1 relation)
       *
       * Transformers:
       *  - May have embedded transformers with async
       *  - May have embedded transformers without async
       *  - May not have embedded transformers
       */

      let transformer: TypescriptCodeBlock;

      // Update / Create
      if (!isUpdate) {
        // Create operation
        const prismaCreateNestedName = `Prisma.${
          foreignModel.name
        }CreateNested${
          localRelation.isList ? 'Many' : 'One'
        }Without${upperCaseFirst(foreignRelation.name)}Input`;

        transformer = TypescriptCodeUtils.createBlock(
          `const ${localRelationName}Input: ${prismaCreateNestedName} | undefined = ${inputName} && { create: ${inputName} };`
        );
      } else {
        // Update operation
        if (!foreignModel.idFields?.length) {
          throw new Error(`${foreignModel.name} does not have id fields`);
        }
        const { idFields: foreignIds } = foreignModel;
        if (foreignIds.length > 2) {
          throw new Error(`${foreignModel.name} needs two or fewer ID fields`);
        }

        const prismaUpdateName = `Prisma.${foreignModel.name}Update${
          localRelation.isList ? 'Many' : 'One'
        }Without${upperCaseFirst(foreignRelation.name)}Input`;

        const foreignVar = lowerCaseFirst(foreignModel.name);

        let transformerPayload = '';

        if (foreignIds.length === 1) {
          const foreignId = foreignIds[0];
          const isForeignIdInRelation =
            foreignRelation.fields?.includes(foreignId);
          if (isForeignIdInRelation) {
            // Single ID field present in foreign relation
            if (localRelation.isList) {
              throw new Error(
                `${localRelationName} is a list but foreign field is also ID`
              );
            }
            transformerPayload = `{ upsert: { create: ${inputName}, update: ${inputName} } }`;
          } else {
            if (!embeddedFieldNames.includes(foreignId)) {
              throw new Error(
                `${foreignId} must be an embedded field since it's an ID field not in the relation`
              );
            }
            // Single ID field not present in foreign relation
            if (localRelation.isList) {
              transformerPayload = `{ upsert: ${inputName}.map(${foreignVar} => 
                ({
                  where: { ${foreignId}: ${foreignVar}.${foreignId} },
                  create: ${foreignVar},
                  update: ${foreignVar}
                }))
              }`;
            } else {
              transformerPayload = `{ upsert: { create: ${inputName}, update: ${inputName} } }`;
            }
          }
        } else {
          if (!localRelation.isList) {
            throw new Error(
              `Local relation ${localRelation.name} cannot be a 1:1 relation with multiple ID fields`
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

          const primaryKeyName = foreignModel.idFields.join('_');

          transformerPayload = `{
    deleteMany: {
      ${primaryIdNotInLocal}: { notIn: ${inputName}.map(${foreignVar} => ${foreignVar}.${primaryIdNotInLocal}) },
    },
    upsert: ${inputName}.map(${foreignVar} => ({
      where: { ${primaryKeyName}: { ${
            foreignRelation?.fields?.[0] || ''
          }: ${localId}, ${primaryIdNotInLocal}: ${foreignVar}.${primaryIdNotInLocal}} },
      update: ${foreignVar},
      create: ${foreignVar}
    }))
  }`;
        }

        transformer = TypescriptCodeUtils.createBlock(
          `const ${localRelationName}Input: ${prismaUpdateName} | undefined = ${inputName} && ${transformerPayload};`
        );
      }

      return {
        inputFields: [inputField],
        outputFields: [
          {
            name: localRelationName,
            outputVariableName: `${localRelationName}Input`,
          },
        ],
        transformer,
        isAsync: false, // TODO!!!
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
