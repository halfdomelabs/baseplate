import {
  tsUtilsProvider,
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
import { notEmpty } from '@src/utils/array';
import { lowerCaseFirst, upperCaseFirst } from '@src/utils/case';
import {
  getDataInputTypeBlock,
  PrismaDataMethodOptions,
} from '../_shared/crud-method/data-method';
import { PrismaOutputProvider, prismaOutputProvider } from '../prisma';
import {
  prismaCrudServiceProvider,
  prismaCrudServiceSetupProvider,
} from '../prisma-crud-service';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  inputName: yup.string(),
  localRelationName: yup.string(),
  embeddedFieldNames: yup.array().of(yup.string().required()),
  foreignCrudServiceRef: yup.string(),
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
    foreignCrudService: prismaCrudServiceProvider.dependency().optional(),
    tsUtils: tsUtilsProvider,
  },
  populateDependencies: (dependencies, { foreignCrudServiceRef }) => ({
    ...dependencies,
    foreignCrudService: foreignCrudServiceRef
      ? dependencies.foreignCrudService.reference(foreignCrudServiceRef)
      : dependencies.foreignCrudService.resolveToNull(),
  }),
  createGenerator(
    {
      name: localRelationName,
      embeddedFieldNames = [],
      embeddedTransformerNames,
      inputName: inputNameDescriptor,
    },
    { prismaOutput, prismaCrudServiceSetup, foreignCrudService, tsUtils }
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

      if (embeddedTransformerNames && !foreignCrudService) {
        throw new Error(
          `Cannot use embedded transformers without a foreign crud service`
        );
      }

      // get transformers
      const embeddedTransformers = embeddedTransformerNames
        ?.map((name) => foreignCrudService?.getTransformerByName(name))
        .filter(notEmpty);

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
       *  - Compound key w/ one ID field being present in foreign relation - 1:many only
       *  - Single ID field not present in foreign relation (e.g. independent id field like TodoList and Todo items) - 1:1 or 1:many
       *  - Single ID field present in foreign relation (1:1 relation) - 1:1 only
       *
       * Primary Key autogenerated:
       *  - Primary key is autogenerated (e.g. item has auto-generated ID)
       *  - Primary key is not autogenerated (e.g. user ID, role name)
       *
       * Transformers:
       *  - May have embedded transformers with async
       *  - May have embedded transformers without async
       *  - May not have embedded transformers
       */

      let transformer: TypescriptCodeBlock;
      let usesNotEmpty = false;

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

        if (!localRelation.isList) {
          // 1:1 relations
          if (foreignIds.length !== 1) {
            throw new Error(
              `A 1:1 relation ${localRelationName} must only have a single unique ID field`
            );
          }

          // TODO: Do we want to consider making input nullable to unset it?
          transformerPayload = `{ upsert: { create: ${inputName}, update: ${inputName} } }`;
        } else {
          // 1:many relations
          const primaryIdsNotInRelation = foreignModel.idFields.filter(
            (id) => !foreignRelation.fields?.includes(id)
          );
          if (primaryIdsNotInRelation.length !== 1) {
            throw new Error(
              `Need exactly one primary key that is not part of relation ${foreignRelation.name} in ${foreignModel.name}`
            );
          }
          const primaryIdNotInRelation = primaryIdsNotInRelation[0];
          const primaryFieldNotInRelation = foreignModel.fields.find(
            (f) => f.name === primaryIdNotInRelation
          );
          if (!primaryFieldNotInRelation) {
            throw new Error(
              `Could not find primary key ${primaryIdNotInRelation} in ${foreignModel.name}`
            );
          }
          const isPrimaryIdAutoGenerated = primaryFieldNotInRelation.hasDefault;

          const primaryIdsInRelation = foreignModel.idFields.filter((id) =>
            foreignRelation.fields?.includes(id)
          );
          if (primaryIdsInRelation.length > 1) {
            throw new Error(
              `Need exactly zero or one primary key that is part of relation ${foreignRelation.name} in ${foreignModel.name}`
            );
          }
          const primaryIdInRelation: string | undefined =
            primaryIdsInRelation[0];

          // Delete all items that are not in the input

          if (isPrimaryIdAutoGenerated) {
            usesNotEmpty = true;
          }
          const deleteClause = `
          deleteMany: {
            ${primaryIdNotInRelation}: { notIn: ${inputName}.map(${foreignVar} => ${foreignVar}.${primaryIdNotInRelation})${
            isPrimaryIdAutoGenerated ? '.filter(notEmpty)' : ''
          } },
          },`;

          // Upsert items that are in the input with all primary keys
          const primaryKeyName = foreignModel.idFields.join('_');

          const upsertFilter = !isPrimaryIdAutoGenerated
            ? ''
            : `.filter(${foreignVar} => ${foreignVar}.${primaryIdNotInRelation} !== undefined)`;

          const upsertWhereClause =
            foreignModel.idFields.length === 1
              ? `${foreignVar}.${primaryIdNotInRelation}`
              : `{ ${primaryIdInRelation}: ${localId}, ${primaryIdNotInRelation}: ${foreignVar}.${primaryIdNotInRelation} }`;

          const upsertClause = `
          upsert: ${inputName}${upsertFilter}.map(${foreignVar} => ({
            where: { ${primaryKeyName}: ${upsertWhereClause} },
            update: ${foreignVar},
            create: ${foreignVar}
          })),
          `;

          // Create items that are in the input with no primary key specified
          const createClause = !isPrimaryIdAutoGenerated
            ? ''
            : `create: ${inputName}.filter(${foreignVar} => ${foreignVar}.${primaryIdNotInRelation} === undefined),`;

          transformerPayload = `{
            ${[deleteClause, upsertClause, createClause]
              .map((str) => str.trim())
              .filter(notEmpty)
              .join('\n')}
          }`;
        }

        transformer = TypescriptCodeUtils.createBlock(
          `const ${localRelationName}Input: ${prismaUpdateName} | undefined = ${inputName} && ${transformerPayload};`,
          usesNotEmpty
            ? `import { notEmpty } from '%ts-utils/arrays'`
            : undefined,
          {
            importMappers: [tsUtils],
          }
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
