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
      '../templates/src/components/alert/alert.tsx',
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
      '../templates/src/components/button/button.tsx',
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
      '../templates/src/components/card/card.tsx',
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

const combobox = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'combobox',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/combobox/combobox.tsx',
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

const formItem = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'form-item',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/form-item/form-item.tsx',
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

const input = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'input',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/input/input.tsx',
    ),
  },
  variables: {},
});

const inputField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'input-field',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/input-field/input-field.tsx',
    ),
  },
  variables: {},
});

const label = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'label',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/label/label.tsx',
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

const loader = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'loader',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/loader/loader.tsx',
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

const scrollArea = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'scroll-area',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/scroll-area/scroll-area.tsx',
    ),
  },
  variables: {},
});

const select = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'select',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/select/select.tsx',
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

const sidebarLayout = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'sidebar-layout',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/sidebar-layout/sidebar-layout.tsx',
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

const toaster = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'toaster',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/toaster/toaster.tsx',
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
  combobox,
  confirmDialog,
  errorableLoader,
  errorDisplay,
  formError,
  formItem,
  formLabel,
  input,
  inputField,
  label,
  linkButton,
  listGroup,
  loader,
  modal,
  notFoundCard,
  reactSelectInput,
  scrollArea,
  select,
  selectInput,
  sidebar,
  sidebarLayout,
  spinner,
  table,
  textAreaInput,
  textInput,
  toaster,
};

const hooksUseControlledState = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'hooks-use-controlled-state',
  projectExports: { useControlledState: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-controlled-state.ts',
    ),
  },
  variables: {},
});

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

export const hooksGroup = {
  hooksUseControlledState,
  useConfirmDialog,
  useStatus,
};

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
    Combobox: {},
    ConfirmDialog: {},
    ErrorableLoader: {},
    ErrorDisplay: {},
    FormError: {},
    FormLabel: {},
    Input: {},
    InputField: {},
    InputFieldController: {},
    Label: {},
    LinkButton: {},
    ListGroup: {},
    Loader: {},
    Modal: {},
    NotFoundCard: {},
    ReactDatePickerInput: {},
    ReactSelectInput: {},
    ScrollArea: {},
    Select: {},
    SelectInput: {},
    Sidebar: {},
    SidebarLayout: {},
    SidebarLayoutContent: {},
    SidebarLayoutSidebar: {},
    Spinner: {},
    Table: {},
    TextArea: {},
    TextAreaInput: {},
    TextInput: {},
    Toaster: {},
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

const stylesButton = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'styles',
  importMapProviders: {},
  name: 'styles-button',
  projectExports: { buttonVariants: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/styles/button.ts'),
  },
  variables: {},
});

const stylesInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'styles',
  importMapProviders: {},
  name: 'styles-input',
  projectExports: { inputVariants: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/styles/input.ts'),
  },
  variables: {},
});

const stylesSelect = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'styles',
  importMapProviders: {},
  name: 'styles-select',
  projectExports: {
    selectCheckVariants: {},
    selectContentVariants: {},
    selectItemVariants: {},
    selectTriggerVariants: {},
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/styles/select.ts'),
  },
  variables: {},
});

export const stylesGroup = { stylesButton, stylesInput, stylesSelect };

const cn = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'cn',
  projectExports: { cn: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/utils/cn.ts'),
  },
  variables: {},
});

const mergeRefs = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'merge-refs',
  projectExports: { mergeRefs: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/merge-refs.ts',
    ),
  },
  variables: {},
});

const typesForm = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'types-form',
  projectExports: {
    AddOptionRequiredFields: { isTypeOnly: true },
    FormFieldProps: { isTypeOnly: true },
    MultiSelectOptionProps: { isTypeOnly: true },
    SelectOptionProps: { isTypeOnly: true },
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/types/form.ts'),
  },
  variables: {},
});

export const utilsGroup = { cn, mergeRefs, typesForm };

export const CORE_REACT_COMPONENTS_TEMPLATES = {
  componentsGroup,
  hooksGroup,
  stylesGroup,
  utilsGroup,
  index,
  reactDatePickerInput,
};
