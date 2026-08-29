import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

const appSecret = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'app-secret',
  projectExports: {
    createSigner: { isTypeOnly: false },
    deriveKey: { isTypeOnly: false },
    SecretPolicy: { isTypeOnly: true },
    Signer: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/app-secret.ts',
    ),
  },
  variables: {},
});

export const CORE_APP_SECRET_TEMPLATES = { appSecret };
