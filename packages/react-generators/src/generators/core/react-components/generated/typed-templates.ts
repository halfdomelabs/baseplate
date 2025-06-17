import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const alert = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'alert',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/Alert/index.tsx',
    ),
  },
  variables: {},
});

const alertIcon = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'alert-icon',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/AlertIcon/index.tsx',
    ),
  },
  variables: {},
});

const backButton = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'back-button',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/BackButton/index.tsx',
    ),
  },
  variables: {},
});

const button = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'button',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/Button/index.tsx',
    ),
  },
  variables: {},
});

const buttonGroup = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'button-group',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/ButtonGroup/index.tsx',
    ),
  },
  variables: {},
});

const card = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'card',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/Card/index.tsx',
    ),
  },
  variables: {},
});

const checkedInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'checked-input',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/CheckedInput/index.tsx',
    ),
  },
  variables: {},
});

const confirmDialog = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'confirm-dialog',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/ConfirmDialog/index.tsx',
    ),
  },
  variables: {},
});

const errorableLoader = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'errorable-loader',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/ErrorableLoader/index.tsx',
    ),
  },
  variables: {},
});

const errorDisplay = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'error-display',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/ErrorDisplay/index.tsx',
    ),
  },
  variables: {},
});

const formError = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'form-error',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/FormError/index.tsx',
    ),
  },
  variables: {},
});

const formLabel = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'form-label',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/FormLabel/index.tsx',
    ),
  },
  variables: {},
});

const linkButton = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'link-button',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/LinkButton/index.tsx',
    ),
  },
  variables: {},
});

const listGroup = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'list-group',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/ListGroup/index.tsx',
    ),
  },
  variables: {},
});

const modal = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'modal',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/Modal/index.tsx',
    ),
  },
  variables: {},
});

const notFoundCard = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'not-found-card',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/NotFoundCard/index.tsx',
    ),
  },
  variables: {},
});

const reactSelectInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'react-select-input',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/ReactSelectInput/index.tsx',
    ),
  },
  variables: {},
});

const selectInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'select-input',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/SelectInput/index.tsx',
    ),
  },
  variables: {},
});

const sidebar = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'sidebar',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/Sidebar/index.tsx',
    ),
  },
  variables: {},
});

const spinner = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'spinner',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/Spinner/index.tsx',
    ),
  },
  variables: {},
});

const table = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'table',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/Table/index.tsx',
    ),
  },
  variables: {},
});

const textAreaInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'text-area-input',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/TextAreaInput/index.tsx',
    ),
  },
  variables: {},
});

const textInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'text-input',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/TextInput/index.tsx',
    ),
  },
  variables: {},
});

const toast = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'toast',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/Toast/index.tsx',
    ),
  },
  variables: {},
});

export const componentsGroup = {
  alert,
  alertIcon,
  backButton,
  button,
  buttonGroup,
  card,
  checkedInput,
  confirmDialog,
  errorableLoader,
  errorDisplay,
  formError,
  formLabel,
  linkButton,
  listGroup,
  modal,
  notFoundCard,
  reactSelectInput,
  selectInput,
  sidebar,
  spinner,
  table,
  textAreaInput,
  textInput,
  toast,
};

const useConfirmDialog = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-confirm-dialog',
  projectExports: {
    useConfirmDialog: {},
    UseConfirmDialogRequestOptions: { isTypeOnly: true },
    useConfirmDialogState: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/useConfirmDialog.ts',
    ),
  },
  variables: {},
});

const useStatus = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-status',
  projectExports: {
    Status: { isTypeOnly: true },
    StatusType: { isTypeOnly: true },
    useStatus: {},
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/hooks/useStatus.ts'),
  },
  variables: {},
});

const useToast = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-toast',
  projectExports: { useToast: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/hooks/useToast.tsx'),
  },
  variables: {},
});

export const hooksGroup = { useConfirmDialog, useStatus, useToast };

const index = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'index',
  projectExports: {
    Alert: {},
    AlertIcon: {},
    BackButton: {},
    Button: {},
    ButtonGroup: {},
    Card: {},
    CheckedInput: {},
    ConfirmDialog: {},
    ErrorableLoader: {},
    ErrorDisplay: {},
    FormError: {},
    FormLabel: {},
    LinkButton: {},
    ListGroup: {},
    Modal: {},
    NotFoundCard: {},
    ReactDatePickerInput: {},
    ReactSelectInput: {},
    SelectInput: {},
    Sidebar: {},
    Spinner: {},
    Table: {},
    TextAreaInput: {},
    TextInput: {},
    Toast: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/index.ts',
    ),
  },
  variables: { TPL_EXPORTS: {} },
});

const reactDatePickerInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'react-date-picker-input',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/ReactDatePickerInput/index.tsx',
    ),
  },
  variables: {},
});

export const CORE_REACT_COMPONENTS_TEMPLATES = {
  componentsGroup,
  hooksGroup,
  index,
  reactDatePickerInput,
};
