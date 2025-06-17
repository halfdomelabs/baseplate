import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const safeLocalStorage = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'safe-local-storage',
  projectExports: { getSafeLocalStorage: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/safe-local-storage.ts',
    ),
  },
  variables: {},
});

export const CORE_REACT_UTILS_TEMPLATES = { safeLocalStorage };
