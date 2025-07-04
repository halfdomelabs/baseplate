import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { prismaCrudServiceSetupProvider } from '#src/generators/prisma/prisma-crud-service/index.js';

import { passwordHasherServiceImportsProvider } from '../password-hasher-service/index.js';

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
