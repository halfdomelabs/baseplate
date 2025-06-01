import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { reactConfigImportsProvider } from '../../react-config/generated/ts-import-maps.js';

const sentry = createTsTemplateFile({
  importMapProviders: { reactConfigImports: reactConfigImportsProvider },
  name: 'sentry',
  projectExports: { logBreadcrumbToSentry: {}, logErrorToSentry: {} },
  source: { path: 'sentry.ts' },
  variables: { TPL_SENTRY_SCOPE_ACTIONS: {} },
});

export const CORE_REACT_SENTRY_TS_TEMPLATES = { sentry };
