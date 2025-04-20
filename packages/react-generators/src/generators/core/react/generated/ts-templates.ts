import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const index = createTsTemplateFile({
  name: 'index',
  projectExports: {},
  source: { path: 'src/index.tsx' },
  variables: { TPL_APP: {}, TPL_HEADER: {} },
});

const viteConfig = createTsTemplateFile({
  name: 'vite-config',
  projectExports: {},
  source: { path: 'vite.config.ts' },
  variables: { TPL_CONFIG: {} },
});

export const CORE_REACT_TS_TEMPLATES = { index, viteConfig };
