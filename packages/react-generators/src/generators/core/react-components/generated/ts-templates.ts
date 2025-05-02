import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@halfdomelabs/core-generators';

const alert = createTsTemplateFile({
  group: 'components',
  name: 'alert',
  projectExports: {},
  source: { path: 'components/Alert/index.tsx' },
  variables: {},
});

const alertIcon = createTsTemplateFile({
  group: 'components',
  name: 'alert-icon',
  projectExports: {},
  source: { path: 'components/AlertIcon/index.tsx' },
  variables: {},
});

const backButton = createTsTemplateFile({
  group: 'components',
  name: 'back-button',
  projectExports: {},
  source: { path: 'components/BackButton/index.tsx' },
  variables: {},
});

const button = createTsTemplateFile({
  group: 'components',
  name: 'button',
  projectExports: {},
  source: { path: 'components/Button/index.tsx' },
  variables: {},
});

const buttonGroup = createTsTemplateFile({
  group: 'components',
  name: 'button-group',
  projectExports: {},
  source: { path: 'components/ButtonGroup/index.tsx' },
  variables: {},
});

const card = createTsTemplateFile({
  group: 'components',
  name: 'card',
  projectExports: {},
  source: { path: 'components/Card/index.tsx' },
  variables: {},
});

const checkedInput = createTsTemplateFile({
  group: 'components',
  name: 'checked-input',
  projectExports: {},
  source: { path: 'components/CheckedInput/index.tsx' },
  variables: {},
});

const confirmDialog = createTsTemplateFile({
  group: 'components',
  name: 'confirm-dialog',
  projectExports: {},
  source: { path: 'components/ConfirmDialog/index.tsx' },
  variables: {},
});

const errorDisplay = createTsTemplateFile({
  group: 'components',
  name: 'error-display',
  projectExports: {},
  source: { path: 'components/ErrorDisplay/index.tsx' },
  variables: {},
});

const errorableLoader = createTsTemplateFile({
  group: 'components',
  name: 'errorable-loader',
  projectExports: {},
  source: { path: 'components/ErrorableLoader/index.tsx' },
  variables: {},
});

const formError = createTsTemplateFile({
  group: 'components',
  name: 'form-error',
  projectExports: {},
  source: { path: 'components/FormError/index.tsx' },
  variables: {},
});

const formLabel = createTsTemplateFile({
  group: 'components',
  name: 'form-label',
  projectExports: {},
  source: { path: 'components/FormLabel/index.tsx' },
  variables: {},
});

const linkButton = createTsTemplateFile({
  group: 'components',
  name: 'link-button',
  projectExports: {},
  source: { path: 'components/LinkButton/index.tsx' },
  variables: {},
});

const listGroup = createTsTemplateFile({
  group: 'components',
  name: 'list-group',
  projectExports: {},
  source: { path: 'components/ListGroup/index.tsx' },
  variables: {},
});

const modal = createTsTemplateFile({
  group: 'components',
  name: 'modal',
  projectExports: {},
  source: { path: 'components/Modal/index.tsx' },
  variables: {},
});

const notFoundCard = createTsTemplateFile({
  group: 'components',
  name: 'not-found-card',
  projectExports: {},
  source: { path: 'components/NotFoundCard/index.tsx' },
  variables: {},
});

const reactSelectInput = createTsTemplateFile({
  group: 'components',
  name: 'react-select-input',
  projectExports: {},
  source: { path: 'components/ReactSelectInput/index.tsx' },
  variables: {},
});

const selectInput = createTsTemplateFile({
  group: 'components',
  name: 'select-input',
  projectExports: {},
  source: { path: 'components/SelectInput/index.tsx' },
  variables: {},
});

const sidebar = createTsTemplateFile({
  group: 'components',
  name: 'sidebar',
  projectExports: {},
  source: { path: 'components/Sidebar/index.tsx' },
  variables: {},
});

const spinner = createTsTemplateFile({
  group: 'components',
  name: 'spinner',
  projectExports: {},
  source: { path: 'components/Spinner/index.tsx' },
  variables: {},
});

const table = createTsTemplateFile({
  group: 'components',
  name: 'table',
  projectExports: {},
  source: { path: 'components/Table/index.tsx' },
  variables: {},
});

const textAreaInput = createTsTemplateFile({
  group: 'components',
  name: 'text-area-input',
  projectExports: {},
  source: { path: 'components/TextAreaInput/index.tsx' },
  variables: {},
});

const textInput = createTsTemplateFile({
  group: 'components',
  name: 'text-input',
  projectExports: {},
  source: { path: 'components/TextInput/index.tsx' },
  variables: {},
});

const toast = createTsTemplateFile({
  group: 'components',
  name: 'toast',
  projectExports: {},
  source: { path: 'components/Toast/index.tsx' },
  variables: {},
});

const componentsGroup = createTsTemplateGroup({
  templates: {
    alert: { destination: 'Alert/index.tsx', template: alert },
    alertIcon: { destination: 'AlertIcon/index.tsx', template: alertIcon },
    backButton: { destination: 'BackButton/index.tsx', template: backButton },
    button: { destination: 'Button/index.tsx', template: button },
    buttonGroup: {
      destination: 'ButtonGroup/index.tsx',
      template: buttonGroup,
    },
    card: { destination: 'Card/index.tsx', template: card },
    checkedInput: {
      destination: 'CheckedInput/index.tsx',
      template: checkedInput,
    },
    confirmDialog: {
      destination: 'ConfirmDialog/index.tsx',
      template: confirmDialog,
    },
    errorableLoader: {
      destination: 'ErrorableLoader/index.tsx',
      template: errorableLoader,
    },
    errorDisplay: {
      destination: 'ErrorDisplay/index.tsx',
      template: errorDisplay,
    },
    formError: { destination: 'FormError/index.tsx', template: formError },
    formLabel: { destination: 'FormLabel/index.tsx', template: formLabel },
    linkButton: { destination: 'LinkButton/index.tsx', template: linkButton },
    listGroup: { destination: 'ListGroup/index.tsx', template: listGroup },
    modal: { destination: 'Modal/index.tsx', template: modal },
    notFoundCard: {
      destination: 'NotFoundCard/index.tsx',
      template: notFoundCard,
    },
    reactSelectInput: {
      destination: 'ReactSelectInput/index.tsx',
      template: reactSelectInput,
    },
    selectInput: {
      destination: 'SelectInput/index.tsx',
      template: selectInput,
    },
    sidebar: { destination: 'Sidebar/index.tsx', template: sidebar },
    spinner: { destination: 'Spinner/index.tsx', template: spinner },
    table: { destination: 'Table/index.tsx', template: table },
    textAreaInput: {
      destination: 'TextAreaInput/index.tsx',
      template: textAreaInput,
    },
    textInput: { destination: 'TextInput/index.tsx', template: textInput },
    toast: { destination: 'Toast/index.tsx', template: toast },
  },
});

const useConfirmDialog = createTsTemplateFile({
  group: 'hooks',
  name: 'use-confirm-dialog',
  projectExports: {
    UseConfirmDialogRequestOptions: { isTypeOnly: true },
    useConfirmDialog: {},
    useConfirmDialogState: {},
  },
  source: { path: 'hooks/useConfirmDialog.ts' },
  variables: {},
});

const useStatus = createTsTemplateFile({
  group: 'hooks',
  name: 'use-status',
  projectExports: {
    Status: { isTypeOnly: true },
    StatusType: { isTypeOnly: true },
    useStatus: {},
  },
  source: { path: 'hooks/useStatus.ts' },
  variables: {},
});

const useToast = createTsTemplateFile({
  group: 'hooks',
  name: 'use-toast',
  projectExports: { useToast: {} },
  source: { path: 'hooks/useToast.tsx' },
  variables: {},
});

const hooksGroup = createTsTemplateGroup({
  templates: {
    useConfirmDialog: {
      destination: 'useConfirmDialog.ts',
      template: useConfirmDialog,
    },
    useStatus: { destination: 'useStatus.ts', template: useStatus },
    useToast: { destination: 'useToast.tsx', template: useToast },
  },
});

const index = createTsTemplateFile({
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
    ReactDatePickerInput: {},
    ErrorDisplay: {},
    ErrorableLoader: {},
    FormError: {},
    FormLabel: {},
    LinkButton: {},
    ListGroup: {},
    Modal: {},
    NotFoundCard: {},
    ReactSelectInput: {},
    SelectInput: {},
    Sidebar: {},
    Spinner: {},
    Table: {},
    TextAreaInput: {},
    TextInput: {},
    Toast: {},
  },
  source: { path: 'components/index.ts' },
  variables: { TPL_EXPORTS: {} },
});

const reactDatePickerInput = createTsTemplateFile({
  name: 'react-date-picker-input',
  projectExports: {},
  source: { path: 'components/ReactDatePickerInput/index.tsx' },
  variables: {},
});

export const CORE_REACT_COMPONENTS_TS_TEMPLATES = {
  componentsGroup,
  hooksGroup,
  index,
  reactDatePickerInput,
};
