import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';

const passwordHasherService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'password-hasher-service',
  projectExports: { createPasswordHash: {}, verifyPasswordHash: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/password-hasher.service.ts',
    ),
  },
  variables: {},
});

export const AUTH_PASSWORD_HASHER_SERVICE_TEMPLATES = { passwordHasherService };
