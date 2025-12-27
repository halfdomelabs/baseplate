import {
  createTsImportMap,
  packageScope,
} from '@baseplate-dev/core-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import {
  authorizerUtilsImportsProvider,
  authorizerUtilsImportsSchema,
} from '#src/generators/prisma/_providers/authorizer-utils-imports.js';

import { PRISMA_AUTHORIZER_UTILS_STUB_PATHS } from './template-paths.js';

const prismaAuthorizerUtilsStubImportsTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_AUTHORIZER_UTILS_STUB_PATHS.provider,
  },
  exports: {
    authorizerUtilsImports: authorizerUtilsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authorizerUtilsImports: createTsImportMap(
          authorizerUtilsImportsSchema,
          {
            checkGlobalAuthorization: paths.utilsAuthorizers,
            checkInstanceAuthorization: paths.utilsAuthorizers,
            GlobalRoleCheck: paths.utilsAuthorizers,
            InstanceRoleCheck: paths.utilsAuthorizers,
          },
        ),
      },
    };
  },
});

export const PRISMA_AUTHORIZER_UTILS_STUB_IMPORTS = {
  task: prismaAuthorizerUtilsStubImportsTask,
};
