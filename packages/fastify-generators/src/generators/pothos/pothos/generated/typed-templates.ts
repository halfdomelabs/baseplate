import {
  createTsTemplateFile,
  tsUtilsImportsProvider,
} from '@baseplate-dev/core-generators';
import path from 'node:path';

const builder = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'builder',
  projectExports: { builder: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/builder.ts',
    ),
  },
  variables: {
    TPL_SCHEMA_BUILDER_OPTIONS: {},
    TPL_SCHEMA_TYPE_OPTIONS: {},
    TPL_SUBSCRIPTION_TYPE: {},
  },
});

const fieldWithInputGlobalTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'field-with-input-payload',
  importMapProviders: {},
  name: 'field-with-input-global-types',
  referencedGeneratorTemplates: {
    fieldWithInputPlugin: {},
    fieldWithInputTypes: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/FieldWithInputPayloadPlugin/global-types.ts',
    ),
  },
  variables: {},
});

const fieldWithInputPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'field-with-input-payload',
  importMapProviders: {},
  name: 'field-with-input-plugin',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/FieldWithInputPayloadPlugin/index.ts',
    ),
  },
  variables: {},
});

const fieldWithInputSchemaBuilder = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'field-with-input-payload',
  importMapProviders: { tsUtilsImports: tsUtilsImportsProvider },
  name: 'field-with-input-schema-builder',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/FieldWithInputPayloadPlugin/schema-builder.ts',
    ),
  },
  variables: {},
});

const fieldWithInputTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'field-with-input-payload',
  importMapProviders: {},
  name: 'field-with-input-types',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/FieldWithInputPayloadPlugin/types.ts',
    ),
  },
  variables: {},
});

export const fieldWithInputPayloadGroup = {
  fieldWithInputGlobalTypes,
  fieldWithInputPlugin,
  fieldWithInputSchemaBuilder,
  fieldWithInputTypes,
};

const stripQueryMutationPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'strip-query-mutation-plugin',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/strip-query-mutation-plugin.ts',
    ),
  },
  variables: {},
});

export const POTHOS_POTHOS_TEMPLATES = {
  builder,
  fieldWithInputPayloadGroup,
  stripQueryMutationPlugin,
};
