import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const passwordHasherService = createTsTemplateFile({
  name: 'password-hasher-service',
  projectExports: { createPasswordHash: {}, verifyPasswordHash: {} },
  source: { path: 'password-hasher.service.ts' },
  variables: {},
});

export const AUTH_PASSWORD_HASHER_SERVICE_TS_TEMPLATES = {
  passwordHasherService,
};
