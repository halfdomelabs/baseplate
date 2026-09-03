import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { reactConfigImportsProvider } from '@baseplate-dev/react-generators';
import path from 'node:path';

const sentry = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { reactConfigImports: reactConfigImportsProvider },
  name: 'sentry',
  projectExports: {
    initSentry: { isTypeOnly: false },
    logBreadcrumbToSentry: { isTypeOnly: false },
    logErrorToSentry: { isTypeOnly: false },
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/sentry.ts'),
  },
  variables: { TPL_SENTRY_SCOPE_ACTIONS: {} },
});

export const CORE_REACT_SENTRY_TEMPLATES = { sentry };
