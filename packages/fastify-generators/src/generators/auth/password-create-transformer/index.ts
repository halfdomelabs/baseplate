import { TypescriptCodeUtils } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaDataTransformableProvider } from '@src/providers/prisma/prisma-data-transformable';
import { passwordHasherServiceProvider } from '../password-hasher-service';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

const PasswordCreateTransformerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaDataTransformable: prismaDataTransformableProvider,
    passwordHasherService: passwordHasherServiceProvider,
  },
  createGenerator(
    descriptor,
    { prismaDataTransformable, passwordHasherService }
  ) {
    prismaDataTransformable.addTransformer({
      inputFields: [
        {
          type: TypescriptCodeUtils.createExpression('string | null'),
          dtoField: {
            name: 'password',
            type: 'scalar',
            scalarType: 'string',
            isOptional: true,
            isNullable: true,
          },
        },
      ],
      outputFields: [{ name: 'passwordHash' }],
      transformer: TypescriptCodeUtils.createBlock(
        'const passwordHash = password ? await hasherService.hash(password) : null;',
        'import {hasherService} from "%password-hasher-service";',
        { importMappers: [passwordHasherService] }
      ),
    });
    return {
      build: async () => {},
    };
  },
});

export default PasswordCreateTransformerGenerator;
