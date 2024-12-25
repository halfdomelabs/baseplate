import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaCrudServiceSetupProvider } from '@src/generators/prisma/prisma-crud-service/index.js';

import { passwordHasherServiceProvider } from '../password-hasher-service/index.js';

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
    { prismaCrudServiceSetup, passwordHasherService },
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
        outputFields: [
          {
            name: 'passwordHash',
            transformer: TypescriptCodeUtils.createBlock(
              'const passwordHash = password ?? await createPasswordHash(password);',
              'import {createPasswordHash} from "%password-hasher-service";',
              { importMappers: [passwordHasherService] },
            ),
          },
        ],
        isAsync: true,
      }),
    });
    return {};
  },
});

export default PrismaPasswordTransformerGenerator;
