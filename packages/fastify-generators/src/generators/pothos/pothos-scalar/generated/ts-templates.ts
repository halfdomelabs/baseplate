import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { errorHandlerServiceImportsProvider } from '../../../core/error-handler-service/generated/ts-import-providers.js';
import { pothosImportsProvider } from '../../pothos/generated/ts-import-maps.js';

const date = createTsTemplateFile({
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    pothosImports: pothosImportsProvider,
  },
  name: 'date',
  projectExports: {},
  source: { path: 'date.ts' },
  variables: {},
});

const dateTime = createTsTemplateFile({
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    pothosImports: pothosImportsProvider,
  },
  name: 'date-time',
  projectExports: {},
  source: { path: 'date-time.ts' },
  variables: {},
});

const uuid = createTsTemplateFile({
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    pothosImports: pothosImportsProvider,
  },
  name: 'uuid',
  projectExports: {},
  source: { path: 'uuid.ts' },
  variables: {},
});

export const POTHOS_POTHOS_SCALAR_TS_TEMPLATES = { date, dateTime, uuid };
