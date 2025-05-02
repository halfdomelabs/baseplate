import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const useSentry = createTsTemplateFile({
  name: 'use-sentry',
  projectExports: {},
  source: { path: 'useSentry.ts' },
  variables: {},
});

export const POTHOS_POTHOS_SENTRY_TS_TEMPLATES = { useSentry };
