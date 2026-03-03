import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import path from 'node:path';

const authClient = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'auth-client',
  projectExports: { authClient: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/auth-client.ts',
    ),
  },
  variables: {},
});

const authLoadedGate = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authHooksImports: authHooksImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'auth-loaded-gate',
  projectExports: { AuthLoadedGate: {} },
  referencedGeneratorTemplates: { authClient: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/app/auth-loaded-gate.tsx',
    ),
  },
  variables: {},
});

export const BETTER_AUTH_REACT_BETTER_AUTH_TEMPLATES = {
  authClient,
  authLoadedGate,
};
