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
      '../templates/components/ui/alert.tsx',
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
  referencedGeneratorTemplates: { cn: {}, stylesButton: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/button.tsx',
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
  referencedGeneratorTemplates: { button: {}, cn: {}, stylesButton: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/calendar.tsx',
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
    path: path.join(import.meta.dirname, '../templates/components/ui/card.tsx'),
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
      '../templates/components/ui/checkbox.tsx',
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
    checkbox: {},
    cn: {},
    formItem: {},
    hooksUseControllerMerged: {},
    typesForm: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/checkbox-field.tsx',
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
      '../templates/components/ui/circular-progress.tsx',
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
    button: {},
    cn: {},
    hooksUseControlledState: {},
    mergeRefs: {},
    scrollArea: {},
    stylesInput: {},
    stylesSelect: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/combobox.tsx',
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
    combobox: {},
    formItem: {},
    hooksUseControllerMerged: {},
    typesForm: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/combobox-field.tsx',
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
    dialog: {},
    useConfirmDialog: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/confirm-dialog.tsx',
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
    button: {},
    calendar: {},
    cn: {},
    formItem: {},
    hooksUseControllerMerged: {},
    popover: {},
    typesForm: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/date-picker-field.tsx',
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
    button: {},
    calendar: {},
    cn: {},
    formItem: {},
    hooksUseControllerMerged: {},
    input: {},
    popover: {},
    typesForm: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/date-time-picker-field.tsx',
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
      '../templates/components/ui/dialog.tsx',
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
  referencedGeneratorTemplates: { cn: {}, typesIcon: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/empty-display.tsx',
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
  referencedGeneratorTemplates: { errorDisplay: {}, loader: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/errorable-loader.tsx',
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
      '../templates/components/ui/error-display.tsx',
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
      '../templates/components/ui/form-item.tsx',
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
  referencedGeneratorTemplates: { cn: {}, stylesInput: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/input.tsx',
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
    cn: {},
    formItem: {},
    input: {},
    mergeRefs: {},
    typesForm: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/input-field.tsx',
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
      '../templates/components/ui/label.tsx',
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
      '../templates/components/ui/loader.tsx',
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
      '../templates/components/ui/navigation-menu.tsx',
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
  referencedGeneratorTemplates: { button: {}, errorDisplay: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/not-found-card.tsx',
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
      '../templates/components/ui/popover.tsx',
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
      '../templates/components/ui/scroll-area.tsx',
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
  referencedGeneratorTemplates: { cn: {}, scrollArea: {}, stylesSelect: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/select.tsx',
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
    formItem: {},
    hooksUseControllerMerged: {},
    select: {},
    typesForm: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/select-field.tsx',
    ),
  },
  variables: {},
});

const separator = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'separator',
  projectExports: { Separator: {} },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/separator.tsx',
    ),
  },
  variables: {},
});

const sheet = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'sheet',
  projectExports: {
    Sheet: {},
    SheetClose: {},
    SheetContent: {},
    SheetDescription: {},
    SheetFooter: {},
    SheetHeader: {},
    SheetTitle: {},
    SheetTrigger: {},
  },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/sheet.tsx',
    ),
  },
  variables: {},
});

const sidebar = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'sidebar',
  projectExports: {
    Sidebar: {},
    SidebarContent: {},
    SidebarFooter: {},
    SidebarGroup: {},
    SidebarGroupAction: {},
    SidebarGroupContent: {},
    SidebarGroupLabel: {},
    SidebarHeader: {},
    SidebarInput: {},
    SidebarInset: {},
    SidebarMenu: {},
    SidebarMenuAction: {},
    SidebarMenuBadge: {},
    SidebarMenuButton: {},
    SidebarMenuItem: {},
    SidebarMenuSkeleton: {},
    SidebarMenuSub: {},
    SidebarMenuSubButton: {},
    SidebarMenuSubItem: {},
    SidebarProvider: {},
    SidebarRail: {},
    SidebarSeparator: {},
    SidebarTrigger: {},
    useSidebar: {},
  },
  referencedGeneratorTemplates: {
    button: {},
    cn: {},
    input: {},
    separator: {},
    sheet: {},
    skeleton: {},
    tooltip: {},
    useMobile: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/sidebar.tsx',
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
      '../templates/components/ui/sidebar-layout.tsx',
    ),
  },
  variables: {},
});

const skeleton = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'skeleton',
  projectExports: { Skeleton: {} },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/skeleton.tsx',
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
      '../templates/components/ui/switch.tsx',
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
    cn: {},
    formItem: {},
    hooksUseControllerMerged: {},
    switchComponent: {},
    typesForm: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/switch-field.tsx',
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
      '../templates/components/ui/table.tsx',
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
      '../templates/components/ui/textarea.tsx',
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
  referencedGeneratorTemplates: { formItem: {}, textarea: {}, typesForm: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/textarea-field.tsx',
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
  referencedGeneratorTemplates: { stylesButton: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/toaster.tsx',
    ),
  },
  variables: {},
});

const tooltip = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'components',
  importMapProviders: {},
  name: 'tooltip',
  projectExports: {
    Tooltip: {},
    TooltipContent: {},
    TooltipProvider: {},
    TooltipTrigger: {},
  },
  referencedGeneratorTemplates: { cn: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/components/ui/tooltip.tsx',
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
  separator,
  sheet,
  sidebar,
  sidebarLayout,
  skeleton,
  switchComponent,
  switchField,
  table,
  textarea,
  textareaField,
  toaster,
  tooltip,
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
  referencedGeneratorTemplates: { mergeRefs: {} },
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

const useMobile = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'hooks',
  importMapProviders: {},
  name: 'use-mobile',
  projectExports: { useIsMobile: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/hooks/use-mobile.ts',
    ),
  },
  variables: {},
});

export const hooksGroup = {
  hooksUseControlledState,
  hooksUseControllerMerged,
  useConfirmDialog,
  useMobile,
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
