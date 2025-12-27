import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authRolesImportsProvider } from '#src/generators/auth/auth-roles/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { dataUtilsImportsProvider } from '#src/generators/prisma/data-utils/generated/ts-import-providers.js';

const utilsAuthorizers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    dataUtilsImports: dataUtilsImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'utils-authorizers',
  projectExports: {
    checkGlobalAuthorization: { isTypeOnly: false },
    checkInstanceAuthorization: { isTypeOnly: false },
    createModelAuthorizer: { isTypeOnly: false },
    GlobalRoleCheck: { isTypeOnly: true },
    InstanceRoleCheck: { isTypeOnly: true },
    ModelAuthorizer: { isTypeOnly: true },
    ModelAuthorizerConfig: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/authorizers.ts',
    ),
  },
  variables: {},
});

export const mainGroup = { utilsAuthorizers };

export const PRISMA_AUTHORIZER_UTILS_TEMPLATES = { mainGroup };
