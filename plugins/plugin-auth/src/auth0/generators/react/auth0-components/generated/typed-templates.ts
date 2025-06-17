import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { reactComponentsImportsProvider } from '@baseplate-dev/react-generators';
import path from 'node:path';

const requireAuth = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'require-auth',
  projectExports: { RequireAuth: { exportedAs: 'default' } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/RequireAuth/index.tsx',
    ),
  },
  variables: {},
});

export const AUTH0_AUTH0_COMPONENTS_TEMPLATES = { requireAuth };
