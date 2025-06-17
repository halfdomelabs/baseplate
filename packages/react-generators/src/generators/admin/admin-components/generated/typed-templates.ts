import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

const descriptionList = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'description-list',
  projectExports: { DescriptionList: { exportName: 'default' } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/DescriptionList/index.tsx',
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
    EmbeddedListInput: { exportName: 'default' },
    EmbeddedListTableProps: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/EmbeddedListInput/index.tsx',
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
    EmbeddedObjectInput: { exportName: 'default' },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/EmbeddedObjectInput/index.tsx',
    ),
  },
  variables: {},
});

export const componentsGroup = {
  descriptionList,
  embeddedListInput,
  embeddedObjectInput,
};

export const ADMIN_ADMIN_COMPONENTS_TEMPLATES = { componentsGroup };
