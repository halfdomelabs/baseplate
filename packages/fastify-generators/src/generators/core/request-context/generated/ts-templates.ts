import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const requestContext = createTsTemplateFile({
  name: 'request-context',
  projectExports: { RequestInfo: { isTypeOnly: true } },
  source: { path: 'request-context.ts' },
  variables: {},
});

export const CORE_REQUEST_CONTEXT_TS_TEMPLATES = { requestContext };
