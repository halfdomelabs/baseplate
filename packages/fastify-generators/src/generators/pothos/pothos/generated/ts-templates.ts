import {
  createTsTemplateFile,
  createTsTemplateGroup,
  tsUtilsImportsProvider,
} from '@halfdomelabs/core-generators';

const builder = createTsTemplateFile({
  name: 'builder',
  projectExports: { builder: {} },
  source: { path: 'builder.ts' },
  variables: {
    TPL_SCHEMA_BUILDER_OPTIONS: {},
    TPL_SCHEMA_TYPE_OPTIONS: {},
    TPL_SUBSCRIPTION_TYPE: {},
  },
});

const globalTypes = createTsTemplateFile({
  group: 'field-with-input-payload',
  name: 'global-types',
  projectExports: {},
  source: { path: 'FieldWithInputPayloadPlugin/global-types.ts' },
  variables: {},
});

const index = createTsTemplateFile({
  group: 'field-with-input-payload',
  name: 'index',
  projectExports: {},
  source: { path: 'FieldWithInputPayloadPlugin/index.ts' },
  variables: {},
});

const schemaBuilder = createTsTemplateFile({
  group: 'field-with-input-payload',
  importMapProviders: { tsUtilsImports: tsUtilsImportsProvider },
  name: 'schema-builder',
  projectExports: {},
  source: { path: 'FieldWithInputPayloadPlugin/schema-builder.ts' },
  variables: {},
});

const types = createTsTemplateFile({
  group: 'field-with-input-payload',
  name: 'types',
  projectExports: {},
  source: { path: 'FieldWithInputPayloadPlugin//types.ts' },
  variables: {},
});

const fieldWithInputPayloadGroup = createTsTemplateGroup({
  templates: {
    globalTypes: { destination: 'global-types.ts', template: globalTypes },
    index: { destination: 'index.ts', template: index },
    schemaBuilder: {
      destination: 'schema-builder.ts',
      template: schemaBuilder,
    },
    types: { destination: 'types.ts', template: types },
  },
});

const stripQueryMutationPlugin = createTsTemplateFile({
  name: 'strip-query-mutation-plugin',
  projectExports: {},
  source: { path: 'strip-query-mutation-plugin.ts' },
  variables: {},
});

export const POTHOS_POTHOS_TS_TEMPLATES = {
  builder,
  fieldWithInputPayloadGroup,
  stripQueryMutationPlugin,
};
