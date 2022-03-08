import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaModelProvider } from '@src/generators/prisma/prisma-model';
import { buildPrismaScalarField } from '@src/writers/prisma-schema/fields';

const descriptorSchema = yup.object({});

const AuthPrismaFieldsGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaModel: prismaModelProvider,
  },
  createGenerator(descriptor, { prismaModel }) {
    prismaModel.addField(
      buildPrismaScalarField('tokensNotBefore', 'dateTime', {
        optional: true,
      })
    );
    return {
      build: async () => {},
    };
  },
});

export default AuthPrismaFieldsGenerator;
