import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@baseplate-dev/core-generators';

import { reactComponentsImportsProvider } from '../../../core/react-components/generated/ts-import-maps.js';

const descriptionList = createTsTemplateFile({
  group: 'components',
  name: 'description-list',
  projectExports: { DescriptionList: { exportName: 'default' } },
  source: { path: 'DescriptionList/index.tsx' },
  variables: {},
});

const embeddedListInput = createTsTemplateFile({
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
  source: { path: 'EmbeddedListInput/index.tsx' },
  variables: {},
});

const embeddedObjectInput = createTsTemplateFile({
  group: 'components',
  importMapProviders: {
    reactComponentsImports: reactComponentsImportsProvider,
  },
  name: 'embedded-object-input',
  projectExports: {
    EmbeddedObjectFormProps: { isTypeOnly: true },
    EmbeddedObjectInput: { exportName: 'default' },
  },
  source: { path: 'EmbeddedObjectInput/index.tsx' },
  variables: {},
});

const componentsGroup = createTsTemplateGroup({
  templates: {
    descriptionList: {
      destination: 'DescriptionList/index.tsx',
      template: descriptionList,
    },
    embeddedListInput: {
      destination: 'EmbeddedListInput/index.tsx',
      template: embeddedListInput,
    },
    embeddedObjectInput: {
      destination: 'EmbeddedObjectInput/index.tsx',
      template: embeddedObjectInput,
    },
  },
});

export const ADMIN_ADMIN_COMPONENTS_TS_TEMPLATES = { componentsGroup };
