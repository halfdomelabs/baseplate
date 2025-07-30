import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const authErrors = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'auth-errors',
  projectExports: { InvalidRoleError: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/auth-errors.ts',
    ),
  },
  variables: {},
});

export const mainGroup = { authErrors };

export const AUTH_AUTH_ERRORS_TEMPLATES = { mainGroup };
