import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { reactErrorImportsProvider } from '../../../core/react-error/generated/ts-import-maps.js';
import { reactSentryImportsProvider } from '../../../core/react-sentry/generated/ts-import-maps.js';

const apolloSentryLink = createTsTemplateFile({
  importMapProviders: {
    reactErrorImports: reactErrorImportsProvider,
    reactSentryImports: reactSentryImportsProvider,
  },
  name: 'apollo-sentry-link',
  projectExports: {},
  source: { path: 'apollo-sentry-link.ts' },
  variables: {},
});

export const APOLLO_APOLLO_SENTRY_TS_TEMPLATES = { apolloSentryLink };
