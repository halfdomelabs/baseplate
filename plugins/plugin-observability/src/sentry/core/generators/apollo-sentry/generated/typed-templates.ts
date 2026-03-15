import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { reactErrorImportsProvider } from '@baseplate-dev/react-generators';
import path from 'node:path';

import { reactSentryImportsProvider } from '#src/sentry/core/generators/react-sentry/generated/ts-import-providers.js';

const apolloSentryLink = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    reactErrorImports: reactErrorImportsProvider,
    reactSentryImports: reactSentryImportsProvider,
  },
  name: 'apollo-sentry-link',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/apollo/apollo-sentry-link.ts',
    ),
  },
  variables: {},
});

export const APOLLO_APOLLO_SENTRY_TEMPLATES = { apolloSentryLink };
