import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { reactErrorImportsProvider } from '../../../core/react-error/index.js';
import { reactSentryImportsProvider } from '../../../core/react-sentry/index.js';

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
