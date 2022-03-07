import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaModelProvider } from '../prisma-model';

const descriptorSchema = yup.object({
  createdAt: yup.boolean().default(true),
  updatedAt: yup.boolean().default(true),
});

const PrismaTimestampFieldsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaModel: prismaModelProvider,
  },
  createGenerator({ createdAt, updatedAt }, { prismaModel }) {
    if (createdAt) {
      prismaModel.addField({
        name: 'createdAt',
        type: 'DateTime',
        attributes: [
          { name: '@map', args: [`"created_at"`] },
          { name: '@db.Timestamptz', args: ['3'] },
          { name: '@default', args: [`now()`] },
        ],
        fieldType: 'scalar',
        scalarType: 'dateTime',
      });
    }
    if (updatedAt) {
      prismaModel.addField({
        name: 'updatedAt',
        type: 'DateTime',
        attributes: [
          { name: '@map', args: [`"updated_at"`] },
          { name: '@default', args: [`now()`] },
          { name: '@db.Timestamptz', args: ['3'] },
          { name: '@updatedAt' },
        ],
        fieldType: 'scalar',
        scalarType: 'dateTime',
      });
    }
    return {
      build: async () => {},
    };
  },
});

export default PrismaTimestampFieldsGenerator;
