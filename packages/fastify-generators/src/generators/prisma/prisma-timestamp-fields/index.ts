import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { prismaModelProvider } from '../prisma-model/index.js';

const descriptorSchema = z.object({
  createdAt: z.boolean().default(true),
  updatedAt: z.boolean().default(true),
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
