import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const safeLocalStorage = createTsTemplateFile({
  name: 'safe-local-storage',
  projectExports: { getSafeLocalStorage: {} },
  source: { path: 'safe-local-storage.ts' },
  variables: {},
});

export const REACT_UTILS_TS_TEMPLATES = {
  safeLocalStorage,
};
