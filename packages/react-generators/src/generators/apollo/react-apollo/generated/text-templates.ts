import { createTextTemplateFile } from '@halfdomelabs/sync';

const codegenYml = createTextTemplateFile({
  name: 'codegen-yml',
  source: { path: 'codegen.yml' },
  variables: { TPL_SCHEMA_LOCATION: { description: 'Location of the schema' } },
});

export const APOLLO_REACT_APOLLO_TEXT_TEMPLATES = {
  codegenYml,
};
