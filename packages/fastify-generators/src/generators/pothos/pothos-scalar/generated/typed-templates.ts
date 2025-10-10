import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { pothosImportsProvider } from '#src/generators/pothos/pothos/generated/ts-import-providers.js';

const date = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'date',
  source: {
    path: path.join(import.meta.dirname, '../templates/module/scalars/date.ts'),
  },
  variables: {},
});

const dateTime = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'date-time',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/scalars/date-time.ts',
    ),
  },
  variables: {},
});

const json = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'json',
  source: {
    path: path.join(import.meta.dirname, '../templates/module/scalars/json.ts'),
  },
  variables: {},
});

const jsonObject = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'json-object',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/scalars/json-object.ts',
    ),
  },
  variables: {},
});

const uuid = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'uuid',
  source: {
    path: path.join(import.meta.dirname, '../templates/module/scalars/uuid.ts'),
  },
  variables: {},
});

export const POTHOS_POTHOS_SCALAR_TEMPLATES = {
  date,
  dateTime,
  json,
  jsonObject,
  uuid,
};
