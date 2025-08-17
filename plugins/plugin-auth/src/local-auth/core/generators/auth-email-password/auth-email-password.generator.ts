import { TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  createPothosPrismaObjectTypeOutputName,
  pothosTypeOutputProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  adminRoles: z.array(z.string()),
  userModelName: z.string(),
});

/**
 * Sets up email / password authentication
 */
export const authEmailPasswordGenerator = createGenerator({
  name: 'local-auth/core/auth-email-password',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ adminRoles, userModelName }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    appModule: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        appModule: appModuleProvider,
      },
      run({ paths, appModule }) {
        appModule.moduleImports.push(paths.schemaUserPasswordMutations);
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
        userObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(createPothosPrismaObjectTypeOutputName(userModelName)),
      },
      run({ renderers, userObjectType }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.moduleGroup.render({
                variables: {
                  schemaUserPasswordMutations: {
                    TPL_ADMIN_ROLES: TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      adminRoles.map((r) => quot(r)).sort(),
                    ),
                    TPL_USER_OBJECT_TYPE:
                      userObjectType.getTypeReference().fragment,
                  },
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
