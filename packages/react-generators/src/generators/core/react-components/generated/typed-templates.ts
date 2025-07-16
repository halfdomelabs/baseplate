import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const alert = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'alert',
  projectExports: { Alert: {}, AlertDescription: {}, AlertTitle: {} },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/alert/alert.tsx',
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
  referencedGeneratorTemplates: { 'styles-button': {}, cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/button/button.tsx',
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
  referencedGeneratorTemplates: { cn: {}, 'styles-button': {}, button: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/calendar/calendar.tsx',
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
    CardContent: {},
    CardDescription: {},
    CardFooter: {},
    CardHeader: {},
    CardTitle: {},
  },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/card/card.tsx',
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
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/checkbox/checkbox.tsx',
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
  referencedGeneratorTemplates: {
    'types-form': {},
    'hooks-use-controller-merged': {},
    cn: {},
    'form-item': {},
    checkbox: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/checkbox-field/checkbox-field.tsx',
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
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/circular-progress/circular-progress.tsx',
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
  referencedGeneratorTemplates: {
    'styles-input': {},
    'styles-select': {},
    cn: {},
    'merge-refs': {},
    button: {},
    'scroll-area': {},
    'hooks-use-controlled-state': {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/combobox/combobox.tsx',
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
  referencedGeneratorTemplates: {
    'types-form': {},
    'hooks-use-controller-merged': {},
    'form-item': {},
    combobox: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/combobox-field/combobox-field.tsx',
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
  referencedGeneratorTemplates: {
    button: {},
    'use-confirm-dialog': {},
    dialog: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/confirm-dialog/confirm-dialog.tsx',
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
  referencedGeneratorTemplates: {
    'types-form': {},
    cn: {},
    'hooks-use-controller-merged': {},
    button: {},
    'form-item': {},
    popover: {},
    calendar: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/date-picker-field/date-picker-field.tsx',
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
  referencedGeneratorTemplates: {
    'types-form': {},
    cn: {},
    'hooks-use-controller-merged': {},
    button: {},
    'form-item': {},
    input: {},
    popover: {},
    calendar: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/date-time-picker-field/date-time-picker-field.tsx',
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
    Modal: {},
  },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/dialog/dialog.tsx',
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
  referencedGeneratorTemplates: { cn: {}, 'types-icon': {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/empty-display/empty-display.tsx',
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
  referencedGeneratorTemplates: { 'error-display': {}, loader: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/errorable-loader/errorable-loader.tsx',
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
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/error-display/error-display.tsx',
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
    FormControl: {},
    FormDescription: {},
    FormItem: {},
    FormLabel: {},
    FormMessage: {},
  },
  referencedGeneratorTemplates: { cn: {}, label: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/form-item/form-item.tsx',
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
  referencedGeneratorTemplates: { cn: {}, 'styles-input': {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/input/input.tsx',
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
  referencedGeneratorTemplates: {
    'types-form': {},
    cn: {},
    'form-item': {},
    'merge-refs': {},
    input: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/input-field/input-field.tsx',
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
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/label/label.tsx',
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
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/loader/loader.tsx',
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
    NavigationMenuContent: {},
    NavigationMenuIndicator: {},
    NavigationMenuItem: {},
    NavigationMenuItemWithLink: {},
    NavigationMenuLink: {},
    NavigationMenuList: {},
    NavigationMenuTrigger: {},
    navigationMenuTriggerStyle: {},
    NavigationMenuViewport: {},
  },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/navigation-menu/navigation-menu.tsx',
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
  referencedGeneratorTemplates: { button: {}, 'error-display': {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/not-found-card/not-found-card.tsx',
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
    PopoverAnchor: {},
    PopoverContent: {},
    PopoverTrigger: {},
  },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/popover/popover.tsx',
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
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/scroll-area/scroll-area.tsx',
    ),
  },
  variables: {},
});

const select = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'select',
  projectExports: { ReactSelectInput: {}, Select: {}, SelectInput: {} },
  referencedGeneratorTemplates: {
    cn: {},
    'scroll-area': {},
    'styles-select': {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/select/select.tsx',
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
  referencedGeneratorTemplates: {
    'types-form': {},
    'form-item': {},
    'hooks-use-controller-merged': {},
    select: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/select-field/select-field.tsx',
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
    SidebarLayoutContent: {},
    SidebarLayoutSidebar: {},
  },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/sidebar-layout/sidebar-layout.tsx',
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
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/switch/switch.tsx',
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
  referencedGeneratorTemplates: {
    'types-form': {},
    cn: {},
    'form-item': {},
    'switch-component': {},
    'hooks-use-controller-merged': {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/switch-field/switch-field.tsx',
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
    TableBody: {},
    TableCaption: {},
    TableCell: {},
    TableFooter: {},
    TableHead: {},
    TableHeader: {},
    TableRow: {},
  },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/table/table.tsx',
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
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/textarea/textarea.tsx',
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
  referencedGeneratorTemplates: {
    'types-form': {},
    textarea: {},
    'form-item': {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/textarea-field/textarea-field.tsx',
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
  referencedGeneratorTemplates: { 'styles-button': {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/toaster/toaster.tsx',
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
  referencedGeneratorTemplates: { 'merge-refs': {} },
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
  referencedGeneratorTemplates: { button: {} },
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
  referencedGeneratorTemplates: { cn: {} },
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
};
