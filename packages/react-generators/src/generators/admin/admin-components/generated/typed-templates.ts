import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const embeddedListField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'embedded-list-field',
  projectExports: {
    EmbeddedListField: {},
    EmbeddedListFieldController: {},
    EmbeddedListFieldProps: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/embedded-list-field/embedded-list-field.tsx',
    ),
  },
  variables: {},
});

const embeddedListInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'embedded-list-input',
  projectExports: {
    EmbeddedListFormProps: { isTypeOnly: true },
    EmbeddedListInput: {},
    EmbeddedListTableProps: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/embedded-list-input/embedded-list-input.tsx',
    ),
  },
  variables: {},
});

const embeddedObjectField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'embedded-object-field',
  projectExports: {
    EmbeddedObjectField: {},
    EmbeddedObjectFieldController: {},
    EmbeddedObjectFieldProps: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/embedded-object-field/embedded-object-field.tsx',
    ),
  },
  variables: {},
});

const embeddedObjectInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'embedded-object-input',
  projectExports: {
    EmbeddedObjectFormProps: { isTypeOnly: true },
    EmbeddedObjectInput: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/embedded-object-input/embedded-object-input.tsx',
    ),
  },
  variables: {},
});

export const componentsGroup = {
  embeddedListField,
  embeddedListInput,
  embeddedObjectField,
  embeddedObjectInput,
};

export const ADMIN_ADMIN_COMPONENTS_TEMPLATES = { componentsGroup };
