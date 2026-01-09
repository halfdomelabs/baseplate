import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const componentsButton = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'components-button',
  referencedGeneratorTemplates: { constantsTheme: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/button.tsx',
    ),
  },
  variables: {},
});

const componentsDivider = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'components-divider',
  referencedGeneratorTemplates: { constantsTheme: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/divider.tsx',
    ),
  },
  variables: {},
});

const componentsHeading = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'components-heading',
  referencedGeneratorTemplates: { constantsTheme: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/heading.tsx',
    ),
  },
  variables: {},
});

const componentsIndex = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'components-index',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/index.ts',
    ),
  },
  variables: {},
});

const componentsLayout = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'components-layout',
  referencedGeneratorTemplates: { componentsDivider: {}, constantsTheme: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/layout.tsx',
    ),
  },
  variables: {},
});

const componentsLink = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'components-link',
  referencedGeneratorTemplates: { constantsTheme: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/link.tsx',
    ),
  },
  variables: {},
});

const componentsSection = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'components-section',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/section.tsx',
    ),
  },
  variables: {},
});

const componentsText = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'components-text',
  referencedGeneratorTemplates: { constantsTheme: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/text.tsx',
    ),
  },
  variables: {},
});

const constantsTheme = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'constants-theme',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/constants/theme.ts'),
  },
  variables: {},
});

const servicesRenderEmail = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'services-render-email',
  projectExports: { renderEmail: { isTypeOnly: false } },
  referencedGeneratorTemplates: { typesEmailComponent: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/render-email.service.tsx',
    ),
  },
  variables: {},
});

const typesEmailComponent = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'types-email-component',
  projectExports: {
    defineEmail: { isTypeOnly: false },
    DefineEmailOptions: { isTypeOnly: true },
    EmailComponent: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/types/email-component.types.ts',
    ),
  },
  variables: {},
});

export const mainGroup = {
  componentsButton,
  componentsDivider,
  componentsHeading,
  componentsIndex,
  componentsLayout,
  componentsLink,
  componentsSection,
  componentsText,
  constantsTheme,
  servicesRenderEmail,
  typesEmailComponent,
};

export const EMAIL_TRANSACTIONAL_LIB_TEMPLATES = { mainGroup };
