import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const useSentry = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'use-sentry',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/use-sentry.ts',
    ),
  },
  variables: {},
});

export const POTHOS_POTHOS_SENTRY_TEMPLATES = { useSentry };
