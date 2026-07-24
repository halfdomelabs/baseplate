import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { appRuntimeImportsProvider } from '#src/generators/core/app-runtime/generated/ts-import-providers.js';

const serviceContext = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { appRuntimeImports: appRuntimeImportsProvider },
  name: 'service-context',
  projectExports: {
    createServiceContext: {},
    createSystemServiceContext: {},
    ExecutionContext: { isTypeOnly: true },
    ServiceContext: { isTypeOnly: true },
    ServiceContextWith: { isTypeOnly: true },
    withScriptContext: {},
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
    TPL_SYSTEM_CONTEXT_OBJECT: {},
  },
});

const testHelper = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'test-helper',
  projectExports: { createTestServiceContext: {} },
  referencedGeneratorTemplates: { serviceContext: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/helpers/service-context.test-helper.ts',
    ),
  },
  variables: {
    TPL_CREATE_TEST_ARGS: {},
    TPL_CREATE_TEST_OBJECT: {},
    TPL_TEST_RUNTIME_SERVICES: {},
  },
});

export const CORE_SERVICE_CONTEXT_TEMPLATES = { serviceContext, testHelper };
