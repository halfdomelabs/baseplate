import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@halfdomelabs/core-generators';

import { errorHandlerServiceImportsProvider } from '../../../core/error-handler-service/generated/ts-import-maps.js';

const globalTypes = createTsTemplateFile({
  group: 'field-authorize-plugin',
  name: 'global-types',
  projectExports: {},
  source: { path: 'FieldAuthorizePlugin/global-types.ts' },
  variables: {},
});

const index = createTsTemplateFile({
  group: 'field-authorize-plugin',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'index',
  projectExports: {},
  source: { path: 'FieldAuthorizePlugin/index.ts' },
  variables: {},
});

const types = createTsTemplateFile({
  group: 'field-authorize-plugin',
  name: 'types',
  projectExports: {},
  source: { path: 'FieldAuthorizePlugin/types.ts' },
  variables: {},
});

const fieldAuthorizePluginGroup = createTsTemplateGroup({
  templates: {
    globalTypes: { destination: 'global-types.ts', template: globalTypes },
    index: { destination: 'index.ts', template: index },
    types: { destination: 'types.ts', template: types },
  },
});

export const POTHOS_POTHOS_AUTH_TS_TEMPLATES = { fieldAuthorizePluginGroup };
