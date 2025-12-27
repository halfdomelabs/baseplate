import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { authorizerUtilsImportsProvider } from '#src/generators/prisma/authorizer-utils/generated/ts-import-providers.js';

const fieldAuthorizeGlobalTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'field-authorize-plugin',
  importMapProviders: {},
  name: 'field-authorize-global-types',
  referencedGeneratorTemplates: {
    fieldAuthorizePlugin: {},
    fieldAuthorizeTypes: {},
  },
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
    authorizerUtilsImports: authorizerUtilsImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'field-authorize-plugin',
  referencedGeneratorTemplates: { fieldAuthorizeTypes: {} },
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
  importMapProviders: {
    authorizerUtilsImports: authorizerUtilsImportsProvider,
  },
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
