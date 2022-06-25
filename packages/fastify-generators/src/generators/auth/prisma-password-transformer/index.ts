import { TypescriptCodeUtils } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { prismaCrudServiceSetupProvider } from '@src/generators/prisma/prisma-crud-service';
import { passwordHasherServiceProvider } from '../password-hasher-service';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

const PrismaPasswordTransformerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    passwordHasherService: passwordHasherServiceProvider,
    prismaCrudServiceSetup: prismaCrudServiceSetupProvider,
  },
  createGenerator(
    descriptor,
    { prismaCrudServiceSetup, passwordHasherService }
  ) {
    prismaCrudServiceSetup.addTransformer('password', {
      buildTransformer: () => ({
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
          'const passwordHash = password && (await hasherService.hash(password));',
          'import {hasherService} from "%password-hasher-service";',
          { importMappers: [passwordHasherService] }
        ),
        isAsync: true,
      }),
    });
    return {
      build: async () => {},
    };
  },
});

export default PrismaPasswordTransformerGenerator;
