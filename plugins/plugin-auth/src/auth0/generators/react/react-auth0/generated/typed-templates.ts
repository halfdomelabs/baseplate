import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const authLoadedGate = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'auth-loaded-gate',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/auth-loaded-gate.tsx',
    ),
  },
  variables: {},
});

export const AUTH0_REACT_AUTH0_TEMPLATES = { authLoadedGate };
