import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactConfigImportsProvider } from '#src/generators/core/react-config/generated/ts-import-providers.js';
import { reactRouterImportsProvider } from '#src/generators/core/react-router/generated/ts-import-providers.js';

const sentry = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactConfigImports: reactConfigImportsProvider,
    reactRouterImports: reactRouterImportsProvider,
  },
  name: 'sentry',
  projectExports: { logBreadcrumbToSentry: {}, logErrorToSentry: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/sentry.ts'),
  },
  variables: { TPL_SENTRY_SCOPE_ACTIONS: {} },
});

export const CORE_REACT_SENTRY_TEMPLATES = { sentry };
