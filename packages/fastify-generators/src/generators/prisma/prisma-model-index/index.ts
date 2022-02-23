import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaModelProvider } from '../prisma-model';

const descriptorSchema = yup.object({
  fields: yup.array(yup.string().required()).required(),
});

const PrismaModelIndexGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaModel: prismaModelProvider,
  },
  createGenerator({ fields }, { prismaModel }) {
    prismaModel.addModelAttribute({
      name: 'index',
      args: [fields],
    });
    return {
      build: async () => {},
    };
  },
});

export default PrismaModelIndexGenerator;
