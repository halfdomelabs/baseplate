import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const notFoundPage = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'not-found-page',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/pages/NotFound.page.tsx',
    ),
  },
  variables: {},
});

export const CORE_REACT_NOT_FOUND_HANDLER_TEMPLATES = { notFoundPage };
