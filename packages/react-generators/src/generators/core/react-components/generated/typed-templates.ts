import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const alert = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'alert',
  projectExports: { Alert: {}, AlertTitle: {}, AlertDescription: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/alert/alert.tsx',
    ),
  },
  variables: {},
});

const button = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'button',
  projectExports: { Button: {}, LinkButton: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/button/button.tsx',
    ),
  },
  variables: {},
});

const calendar = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'calendar',
  projectExports: { Calendar: {} },
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
  projectExports: {
    Card: {},
    CardHeader: {},
    CardFooter: {},
    CardTitle: {},
    CardDescription: {},
    CardContent: {},
  },
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
  projectExports: { Checkbox: {}, CheckedInput: {} },
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
  projectExports: { CheckboxField: {}, CheckboxFieldController: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/checkbox-field/checkbox-field.tsx',
    ),
  },
  variables: {},
});

const circularProgress = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'circular-progress',
  projectExports: { CircularProgress: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/circular-progress/circular-progress.tsx',
    ),
  },
  variables: {},
});

const combobox = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'combobox',
  projectExports: { Combobox: {} },
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
  projectExports: { ComboboxField: {}, ComboboxFieldController: {} },
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
  projectExports: { ConfirmDialog: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/confirm-dialog/confirm-dialog.tsx',
    ),
  },
  variables: {},
});

const datePickerField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'date-picker-field',
  projectExports: {
    DatePickerField: {},
    DatePickerFieldController: {},
    ReactDatePickerInput: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/date-picker-field/date-picker-field.tsx',
    ),
  },
  variables: {},
});

const dateTimePickerField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'date-time-picker-field',
  projectExports: {
    DateTimePickerField: {},
    DateTimePickerFieldController: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/date-time-picker-field/date-time-picker-field.tsx',
    ),
  },
  variables: {},
});

const dialog = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'dialog',
  projectExports: {
    Dialog: {},
    DialogTrigger: {},
    DialogPortal: {},
    DialogOverlay: {},
    DialogClose: {},
    DialogContent: {},
    DialogHeader: {},
    DialogFooter: {},
    DialogTitle: {},
    DialogDescription: {},
    DialogWidth: { isTypeOnly: true },
    Modal: {},
  },
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
  projectExports: { EmptyDisplay: {} },
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
  projectExports: { ErrorableLoader: {} },
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
  projectExports: { ErrorDisplay: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/error-display/error-display.tsx',
    ),
  },
  variables: {},
});

const formItem = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'form-item',
  projectExports: {
    FormItem: {},
    FormLabel: {},
    FormControl: {},
    FormDescription: {},
    FormMessage: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/form-item/form-item.tsx',
    ),
  },
  variables: {},
});

const input = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'input',
  projectExports: { Input: {}, TextInput: {} },
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
  projectExports: { InputField: {}, InputFieldController: {} },
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
  projectExports: { Label: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/label/label.tsx',
    ),
  },
  variables: {},
});

const loader = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'loader',
  projectExports: { Loader: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/loader/loader.tsx',
    ),
  },
  variables: {},
});

const navigationMenu = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'navigation-menu',
  projectExports: {
    NavigationMenu: {},
    NavigationMenuList: {},
    NavigationMenuItem: {},
    NavigationMenuContent: {},
    NavigationMenuTrigger: {},
    NavigationMenuLink: {},
    NavigationMenuIndicator: {},
    NavigationMenuViewport: {},
    navigationMenuTriggerStyle: {},
    NavigationMenuItemWithLink: {},
  },
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
  projectExports: { NotFoundCard: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/not-found-card/not-found-card.tsx',
    ),
  },
  variables: {},
});

const popover = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'popover',
  projectExports: {
    Popover: {},
    PopoverTrigger: {},
    PopoverContent: {},
    PopoverAnchor: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/popover/popover.tsx',
    ),
  },
  variables: {},
});

const scrollArea = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'scroll-area',
  projectExports: { ScrollArea: {} },
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
  projectExports: { Select: {}, SelectInput: {}, ReactSelectInput: {} },
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
  projectExports: { SelectField: {}, SelectFieldController: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/select-field/select-field.tsx',
    ),
  },
  variables: {},
});

const sidebarLayout = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'sidebar-layout',
  projectExports: {
    SidebarLayout: {},
    SidebarLayoutSidebar: {},
    SidebarLayoutContent: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/sidebar-layout/sidebar-layout.tsx',
    ),
  },
  variables: {},
});

const switchComponent = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'switch-component',
  projectExports: { Switch: {} },
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
  projectExports: { SwitchField: {}, SwitchFieldController: {} },
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
  projectExports: {
    Table: {},
    TableHeader: {},
    TableBody: {},
    TableFooter: {},
    TableHead: {},
    TableRow: {},
    TableCell: {},
    TableCaption: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/table/table.tsx',
    ),
  },
  variables: {},
});

const textarea = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'textarea',
  projectExports: { Textarea: {}, TextAreaInput: {} },
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
  projectExports: { TextareaField: {}, TextareaFieldController: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/components/textarea-field/textarea-field.tsx',
    ),
  },
  variables: {},
});

const toaster = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'toaster',
  projectExports: { Toaster: {} },
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
  button,
  calendar,
  card,
  checkbox,
  checkboxField,
  circularProgress,
  combobox,
  comboboxField,
  confirmDialog,
  datePickerField,
  dateTimePickerField,
  dialog,
  emptyDisplay,
  errorableLoader,
  errorDisplay,
  formItem,
  input,
  inputField,
  label,
  loader,
  navigationMenu,
  notFoundCard,
  popover,
  scrollArea,
  select,
  selectField,
  sidebarLayout,
  switchComponent,
  switchField,
  table,
  textarea,
  textareaField,
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
      '../templates/src/hooks/use-confirm-dialog.ts',
    ),
  },
  variables: {},
});

export const hooksGroup = {
  hooksUseControlledState,
  hooksUseControllerMerged,
  useConfirmDialog,
};

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
    selectTriggerVariants: {},
    selectContentVariants: {},
    selectItemVariants: {},
    selectCheckVariants: {},
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
};
