import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';

const fieldAuthorizeGlobalTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'field-authorize-plugin',
  importMapProviders: {},
  name: 'field-authorize-global-types',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/FieldAuthorizePlugin/global-types.ts',
    ),
  },
  variables: {},
});

const fieldAuthorizePlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'field-authorize-plugin',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'field-authorize-plugin',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/FieldAuthorizePlugin/index.ts',
    ),
  },
  variables: {},
});

const fieldAuthorizeTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'field-authorize-plugin',
  importMapProviders: {},
  name: 'field-authorize-types',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/FieldAuthorizePlugin/types.ts',
    ),
  },
  variables: {},
});

export const fieldAuthorizePluginGroup = {
  fieldAuthorizeGlobalTypes,
  fieldAuthorizePlugin,
  fieldAuthorizeTypes,
};

export const POTHOS_POTHOS_AUTH_TEMPLATES = { fieldAuthorizePluginGroup };
