import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const useSentry = createTsTemplateFile({
  name: 'use-sentry',
  projectExports: {},
  source: { path: 'use-sentry.ts' },
  variables: {},
});

export const POTHOS_POTHOS_SENTRY_TS_TEMPLATES = { useSentry };
