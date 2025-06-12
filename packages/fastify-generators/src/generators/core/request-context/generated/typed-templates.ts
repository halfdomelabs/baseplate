import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const requestContext = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'request-context',
  projectExports: { RequestInfo: { isTypeOnly: true } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/request-context.ts',
    ),
  },
  variables: {},
});

export const CORE_REQUEST_CONTEXT_TEMPLATES = { requestContext };
