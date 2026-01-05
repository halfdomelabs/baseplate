import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

const asyncBoundary = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'async-boundary',
  projectExports: { AsyncBoundary: { isTypeOnly: false } },
  referencedGeneratorTemplates: { component: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/async-boundary.tsx',
    ),
  },
  variables: {},
});

const component = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'component',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/error-boundary.tsx',
    ),
  },
  variables: {},
});

export const CORE_REACT_ERROR_BOUNDARY_TEMPLATES = { asyncBoundary, component };
