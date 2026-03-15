import {
  createNodePackagesTask,
  extractPackageVersions,
  TsCodeUtils,
} from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  createPothosPrismaObjectTypeOutputName,
  pothosTypeOutputProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { BETTER_AUTH_MODELS } from '#src/better-auth/constants/model-names.js';
import { BETTER_AUTH_PACKAGES } from '#src/better-auth/constants/packages.js';

import { BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  adminRoles: z.array(z.string()),
});

/**
 * Generator for better-auth admin mutations.
 *
 * Adds GraphQL mutations for admin operations:
 * - resetUserPassword: Allows admins to reset any user's password
 * - updateUserRoles: Allows admins to manage user role assignments
 */
export const betterAuthAdminModuleGenerator = createGenerator({
  name: 'better-auth/better-auth-admin-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ adminRoles }) => ({
    paths: BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_GENERATED.paths.task,
    imports: BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_GENERATED.imports.task,
    renderers: BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers:
          BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_GENERATED.renderers.provider,
        paths: BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_GENERATED.paths.provider,
        appModule: appModuleProvider,
        userObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(
            createPothosPrismaObjectTypeOutputName(BETTER_AUTH_MODELS.user),
          ),
      },
      run({ renderers, paths, appModule, userObjectType }) {
        appModule.moduleImports.push(paths.adminAuthMutations);

        return {
          build: async (builder) => {
            await builder.apply(renderers.adminAuthService.render({}));
            await builder.apply(
              renderers.adminAuthMutations.render({
                variables: {
                  TPL_ADMIN_ROLES: TsCodeUtils.mergeFragmentsAsArrayPresorted(
                    adminRoles.map((r) => quot(r)).toSorted(),
                  ),
                  TPL_USER_OBJECT_TYPE:
                    userObjectType.getTypeReference().fragment,
                },
              }),
            );
          },
        };
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(BETTER_AUTH_PACKAGES, ['better-auth']),
    }),
  }),
});
