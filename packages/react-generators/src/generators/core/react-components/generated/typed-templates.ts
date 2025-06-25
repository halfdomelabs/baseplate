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

const calendar = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'calendar',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/calendar/calendar.tsx',
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

const checkbox = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'checkbox',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/checkbox/checkbox.tsx',
    ),
  },
  variables: {},
});

const checkboxField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'checkbox-field',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/checkbox-field/checkbox-field.tsx',
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

const comboboxField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'combobox-field',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/combobox-field/combobox-field.tsx',
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

const datePickerField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'date-picker-field',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/date-picker-field/date-picker-field.tsx',
    ),
  },
  variables: {},
});

const dialog = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'dialog',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/dialog/dialog.tsx',
    ),
  },
  variables: {},
});

const emptyDisplay = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'empty-display',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/empty-display/empty-display.tsx',
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
      '../templates/src/components/errorable-loader/errorable-loader.tsx',
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
      '../templates/src/components/error-display/error-display.tsx',
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

const navigationMenu = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'navigation-menu',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/navigation-menu/navigation-menu.tsx',
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

const popover = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'popover',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/popover/popover.tsx',
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

const selectField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'select-field',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/select-field/select-field.tsx',
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

const switchComponent = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'switch-component',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/switch/switch.tsx',
    ),
  },
  variables: {},
});

const switchField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'switch-field',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/switch-field/switch-field.tsx',
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

const textarea = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'textarea',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/textarea/textarea.tsx',
    ),
  },
  variables: {},
});

const textareaField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'textarea-field',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/textarea-field/textarea-field.tsx',
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
  calendar,
  card,
  checkbox,
  checkboxField,
  checkedInput,
  combobox,
  comboboxField,
  confirmDialog,
  datePickerField,
  dialog,
  emptyDisplay,
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
  navigationMenu,
  notFoundCard,
  popover,
  reactSelectInput,
  scrollArea,
  select,
  selectField,
  selectInput,
  sidebarLayout,
  spinner,
  switchComponent,
  switchField,
  table,
  textarea,
  textareaField,
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

const hooksUseControllerMerged = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'hooks-use-controller-merged',
  projectExports: { useControllerMerged: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-controller-merged.ts',
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
  hooksUseControllerMerged,
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
    Calendar: {},
    Card: {},
    Checkbox: {},
    CheckboxField: {},
    CheckboxFieldController: {},
    CheckedInput: {},
    Combobox: {},
    ComboboxField: {},
    ComboboxFieldController: {},
    ConfirmDialog: {},
    DatePickerField: {},
    DatePickerFieldController: {},
    Dialog: {},
    DialogClose: {},
    DialogContent: {},
    DialogDescription: {},
    DialogFooter: {},
    DialogHeader: {},
    DialogOverlay: {},
    DialogPortal: {},
    DialogTitle: {},
    DialogTrigger: {},
    DialogWidth: { isTypeOnly: true },
    EmptyDisplay: {},
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
    NavigationMenu: {},
    NavigationMenuContent: {},
    NavigationMenuIndicator: {},
    NavigationMenuItem: {},
    NavigationMenuItemWithLink: {},
    NavigationMenuLink: {},
    NavigationMenuList: {},
    NavigationMenuTrigger: {},
    navigationMenuTriggerStyle: {},
    NavigationMenuViewport: {},
    NotFoundCard: {},
    Popover: {},
    PopoverAnchor: {},
    PopoverContent: {},
    PopoverTrigger: {},
    ReactDatePickerInput: {},
    ReactSelectInput: {},
    ScrollArea: {},
    Select: {},
    SelectField: {},
    SelectFieldController: {},
    SelectInput: {},
    SidebarLayout: {},
    SidebarLayoutContent: {},
    SidebarLayoutSidebar: {},
    Spinner: {},
    Switch: {},
    SwitchField: {},
    SwitchFieldController: {},
    Table: {},
    Textarea: {},
    TextareaField: {},
    TextareaFieldController: {},
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

const typesIcon = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'types-icon',
  projectExports: { IconElement: { isTypeOnly: true } },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/types/icon.ts'),
  },
  variables: {},
});

export const utilsGroup = { cn, mergeRefs, typesForm, typesIcon };

export const CORE_REACT_COMPONENTS_TEMPLATES = {
  componentsGroup,
  hooksGroup,
  stylesGroup,
  utilsGroup,
  index,
  reactDatePickerInput,
};
