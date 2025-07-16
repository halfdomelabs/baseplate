import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

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
      '../templates/components/ui/error-boundary/error-boundary.tsx',
    ),
  },
  variables: {},
});

export const CORE_REACT_ERROR_BOUNDARY_TEMPLATES = { component };
