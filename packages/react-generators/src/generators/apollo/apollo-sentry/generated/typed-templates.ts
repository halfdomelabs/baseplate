import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';
import { reactSentryImportsProvider } from '#src/generators/core/react-sentry/generated/ts-import-providers.js';

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
