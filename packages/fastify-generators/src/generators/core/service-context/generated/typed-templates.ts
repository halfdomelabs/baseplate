import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const serviceContext = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'service-context',
  projectExports: {
    ServiceContext: { isTypeOnly: true },
    createServiceContext: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/service-context.ts',
    ),
  },
  variables: {
    TPL_CONTEXT_INTERFACE: {},
    TPL_CONTEXT_OBJECT: {},
    TPL_CREATE_CONTEXT_ARGS: {},
  },
});

const testHelper = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'test-helper',
  projectExports: { createTestServiceContext: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/helpers/service-context.test-helper.ts',
    ),
  },
  variables: { TPL_CREATE_TEST_ARGS: {}, TPL_CREATE_TEST_OBJECT: {} },
});

export const CORE_SERVICE_CONTEXT_TEMPLATES = { testHelper, serviceContext };
