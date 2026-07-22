import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const appRuntime = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'app-runtime',
  projectExports: { AppRuntime: { isTypeOnly: true }, createAppRuntime: {} },
  referencedGeneratorTemplates: { runtimeServices: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/app-runtime.ts',
    ),
  },
  variables: {},
});

const runtimeServices = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'runtime-services',
  projectExports: { RuntimeServices: { isTypeOnly: true } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/runtime-services.ts',
    ),
  },
  variables: {},
});

export const CORE_APP_RUNTIME_TEMPLATES = { appRuntime, runtimeServices };
