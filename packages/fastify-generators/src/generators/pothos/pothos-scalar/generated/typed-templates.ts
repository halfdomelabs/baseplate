import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { pothosImportsProvider } from '#src/generators/pothos/pothos/generated/ts-import-providers.js';

const date = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    pothosImports: pothosImportsProvider,
  },
  name: 'date',
  source: {
    path: path.join(import.meta.dirname, '../templates/module/scalars/date.ts'),
  },
  variables: {},
});

const dateTime = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    pothosImports: pothosImportsProvider,
  },
  name: 'date-time',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/scalars/date-time.ts',
    ),
  },
  variables: {},
});

const uuid = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    pothosImports: pothosImportsProvider,
  },
  name: 'uuid',
  source: {
    path: path.join(import.meta.dirname, '../templates/module/scalars/uuid.ts'),
  },
  variables: {},
});

export const POTHOS_POTHOS_SCALAR_TEMPLATES = { dateTime, date, uuid };
