import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaModelProvider } from '../prisma-model';

const REFERENTIAL_ACTIONS = [
  'Cascade',
  'Restrict',
  'NoAction',
  'SetNull',
  'SetDefault',
];

const descriptorSchema = yup.object({
  name: yup.string().required(),
  fields: yup.array(yup.string().required()).required(),
  references: yup.array(yup.string().required()).required(),
  modelRef: yup.string().required(),
  foreignRelationName: yup.string(),
  relationshipName: yup.string(),
  relationshipType: yup
    .string()
    .oneOf(['oneToOne', 'oneToMany'])
    .default('oneToMany'),
  optional: yup.boolean().default(false),
  onDelete: yup.string().oneOf(REFERENTIAL_ACTIONS).default('Cascade'),
  onUpdate: yup.string().oneOf(REFERENTIAL_ACTIONS).default('Restrict'),
});

const PrismaRelationFieldGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaModel: prismaModelProvider,
    foreignModel: prismaModelProvider,
  },
  populateDependencies: (deps, { modelRef }) => ({
    ...deps,
    foreignModel: deps.foreignModel.dependency().reference(modelRef),
  }),
  createGenerator(descriptor, { prismaModel, foreignModel }) {
    const {
      name,
      fields,
      references,
      foreignRelationName,
      relationshipName,
      relationshipType,
      optional,
      onDelete,
      onUpdate,
    } = descriptor;

    const isManyToOne = relationshipType === 'oneToMany';
    const modelName = foreignModel.getName();

    prismaModel.addField({
      name,
      type: `${modelName}${optional ? '?' : ''}`,
      fieldType: 'relation',
      attributes: [
        {
          name: '@relation',
          args: [
            ...(relationshipName ? [relationshipName] : []),
            {
              fields,
              references,
              onDelete,
              onUpdate,
            },
          ],
        },
      ],
    });

    if (foreignRelationName) {
      foreignModel.addField({
        name: foreignRelationName,
        type: `${prismaModel.getName()}${isManyToOne ? '[]' : '?'}`,
        fieldType: 'relation',
        attributes: relationshipName
          ? [{ name: '@relation', args: [relationshipName] }]
          : [],
      });
    }

    return {
      build: async () => {},
    };
  },
});

export default PrismaRelationFieldGenerator;
