import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const passwordHasherService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
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
