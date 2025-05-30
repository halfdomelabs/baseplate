import { tsCodeFragment } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { prismaCrudServiceSetupProvider } from '#src/generators/prisma/prisma-crud-service/prisma-crud-service.generator.js';

import { passwordHasherServiceImportsProvider } from '../password-hasher-service/password-hasher-service.generator.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export const prismaPasswordTransformerGenerator = createGenerator({
  name: 'auth/prisma-password-transformer',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        passwordHasherServiceImports: passwordHasherServiceImportsProvider,
        prismaCrudServiceSetup: prismaCrudServiceSetupProvider,
      },
      run({ prismaCrudServiceSetup, passwordHasherServiceImports }) {
        prismaCrudServiceSetup.addTransformer('password', {
          buildTransformer: () => ({
            inputFields: [
              {
                type: tsCodeFragment('string | null'),
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
                transformer: tsCodeFragment(
                  'const passwordHash = password ?? await createPasswordHash(password);',
                  passwordHasherServiceImports.createPasswordHash.declaration(),
                ),
              },
            ],
            isAsync: true,
          }),
        });
        return {};
      },
    }),
  }),
});
