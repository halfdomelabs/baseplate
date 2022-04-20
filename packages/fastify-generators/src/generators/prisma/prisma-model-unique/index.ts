import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaModelProvider } from '../prisma-model';

const descriptorSchema = yup.object({
  fields: yup
    .array(
      yup.object({
        name: yup.string().required(),
      })
    )
    .required(),
});

const PrismaModelUniqueGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaModel: prismaModelProvider,
  },
  createGenerator({ fields }, { prismaModel }) {
    prismaModel.addModelAttribute({
      name: '@@unique',
      args: [fields.map(({ name }) => name)],
    });
    return {
      build: async () => {},
    };
  },
});

export default PrismaModelUniqueGenerator;
