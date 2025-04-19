import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const serviceContext = createTsTemplateFile({
  name: 'service-context',
  projectExports: {
    ServiceContext: { isTypeOnly: true },
    createServiceContext: {},
  },
  source: { path: 'service-context.ts' },
  variables: {
    TPL_CONTEXT_INTERFACE: {},
    TPL_CONTEXT_OBJECT: {},
    TPL_CREATE_CONTEXT_ARGS: {},
  },
});

const testHelper = createTsTemplateFile({
  name: 'test-helper',
  projectExports: { createTestServiceContext: {} },
  source: { path: 'service-context.test-helper.ts' },
  variables: { TPL_CREATE_TEST_ARGS: {}, TPL_CREATE_TEST_OBJECT: {} },
});

export const CORE_SERVICE_CONTEXT_TS_TEMPLATES = { serviceContext, testHelper };
