import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { CORE_REACT_COMPONENTS_PATHS } from './template-paths.js';

const reactComponentsImportsSchema = createTsImportMapSchema({
  AddOptionRequiredFields: { isTypeOnly: true },
  Alert: {},
  AlertDescription: {},
  AlertTitle: {},
  Button: {},
  buttonVariants: {},
  Calendar: {},
  Card: {},
  CardContent: {},
  CardDescription: {},
  CardFooter: {},
  CardHeader: {},
  CardTitle: {},
  Checkbox: {},
  CheckboxField: {},
  CheckboxFieldController: {},
  CheckedInput: {},
  CircularProgress: {},
  cn: {},
  Combobox: {},
  ComboboxField: {},
  ComboboxFieldController: {},
  ConfirmDialog: {},
  DatePickerField: {},
  DatePickerFieldController: {},
  DateTimePickerField: {},
  DateTimePickerFieldController: {},
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
  FormControl: {},
  FormDescription: {},
  FormFieldProps: { isTypeOnly: true },
  FormItem: {},
  FormLabel: {},
  FormMessage: {},
  IconElement: { isTypeOnly: true },
  Input: {},
  InputField: {},
  InputFieldController: {},
  inputVariants: {},
  Label: {},
  LinkButton: {},
  Loader: {},
  mergeRefs: {},
  Modal: {},
  MultiSelectOptionProps: { isTypeOnly: true },
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
  selectCheckVariants: {},
  selectContentVariants: {},
  SelectField: {},
  SelectFieldController: {},
  SelectInput: {},
  selectItemVariants: {},
  SelectOptionProps: { isTypeOnly: true },
  selectTriggerVariants: {},
  SidebarLayout: {},
  SidebarLayoutContent: {},
  SidebarLayoutSidebar: {},
  Switch: {},
  SwitchField: {},
  SwitchFieldController: {},
  Table: {},
  TableBody: {},
  TableCaption: {},
  TableCell: {},
  TableFooter: {},
  TableHead: {},
  TableHeader: {},
  TableRow: {},
  Textarea: {},
  TextareaField: {},
  TextareaFieldController: {},
  TextAreaInput: {},
  TextInput: {},
  Toaster: {},
  useConfirmDialog: {},
  UseConfirmDialogRequestOptions: { isTypeOnly: true },
  useConfirmDialogState: {},
  useControlledState: {},
  useControllerMerged: {},
});

export type ReactComponentsImportsProvider = TsImportMapProviderFromSchema<
  typeof reactComponentsImportsSchema
>;

export const reactComponentsImportsProvider =
  createReadOnlyProviderType<ReactComponentsImportsProvider>(
    'react-components-imports',
  );

const coreReactComponentsImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_COMPONENTS_PATHS.provider,
  },
  exports: {
    reactComponentsImports: reactComponentsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        reactComponentsImports: createTsImportMap(
          reactComponentsImportsSchema,
          {
            AddOptionRequiredFields: paths.typesForm,
            Alert: paths.alert,
            AlertDescription: paths.alert,
            AlertTitle: paths.alert,
            Button: paths.button,
            buttonVariants: paths.stylesButton,
            Calendar: paths.calendar,
            Card: paths.card,
            CardContent: paths.card,
            CardDescription: paths.card,
            CardFooter: paths.card,
            CardHeader: paths.card,
            CardTitle: paths.card,
            Checkbox: paths.checkbox,
            CheckboxField: paths.checkboxField,
            CheckboxFieldController: paths.checkboxField,
            CheckedInput: paths.checkbox,
            CircularProgress: paths.circularProgress,
            cn: paths.cn,
            Combobox: paths.combobox,
            ComboboxField: paths.comboboxField,
            ComboboxFieldController: paths.comboboxField,
            ConfirmDialog: paths.confirmDialog,
            DatePickerField: paths.datePickerField,
            DatePickerFieldController: paths.datePickerField,
            DateTimePickerField: paths.dateTimePickerField,
            DateTimePickerFieldController: paths.dateTimePickerField,
            Dialog: paths.dialog,
            DialogClose: paths.dialog,
            DialogContent: paths.dialog,
            DialogDescription: paths.dialog,
            DialogFooter: paths.dialog,
            DialogHeader: paths.dialog,
            DialogOverlay: paths.dialog,
            DialogPortal: paths.dialog,
            DialogTitle: paths.dialog,
            DialogTrigger: paths.dialog,
            DialogWidth: paths.dialog,
            EmptyDisplay: paths.emptyDisplay,
            ErrorableLoader: paths.errorableLoader,
            ErrorDisplay: paths.errorDisplay,
            FormControl: paths.formItem,
            FormDescription: paths.formItem,
            FormFieldProps: paths.typesForm,
            FormItem: paths.formItem,
            FormLabel: paths.formItem,
            FormMessage: paths.formItem,
            IconElement: paths.typesIcon,
            Input: paths.input,
            InputField: paths.inputField,
            InputFieldController: paths.inputField,
            inputVariants: paths.stylesInput,
            Label: paths.label,
            LinkButton: paths.button,
            Loader: paths.loader,
            mergeRefs: paths.mergeRefs,
            Modal: paths.dialog,
            MultiSelectOptionProps: paths.typesForm,
            NavigationMenu: paths.navigationMenu,
            NavigationMenuContent: paths.navigationMenu,
            NavigationMenuIndicator: paths.navigationMenu,
            NavigationMenuItem: paths.navigationMenu,
            NavigationMenuItemWithLink: paths.navigationMenu,
            NavigationMenuLink: paths.navigationMenu,
            NavigationMenuList: paths.navigationMenu,
            NavigationMenuTrigger: paths.navigationMenu,
            navigationMenuTriggerStyle: paths.navigationMenu,
            NavigationMenuViewport: paths.navigationMenu,
            NotFoundCard: paths.notFoundCard,
            Popover: paths.popover,
            PopoverAnchor: paths.popover,
            PopoverContent: paths.popover,
            PopoverTrigger: paths.popover,
            ReactDatePickerInput: paths.datePickerField,
            ReactSelectInput: paths.select,
            ScrollArea: paths.scrollArea,
            Select: paths.select,
            selectCheckVariants: paths.stylesSelect,
            selectContentVariants: paths.stylesSelect,
            SelectField: paths.selectField,
            SelectFieldController: paths.selectField,
            SelectInput: paths.select,
            selectItemVariants: paths.stylesSelect,
            SelectOptionProps: paths.typesForm,
            selectTriggerVariants: paths.stylesSelect,
            SidebarLayout: paths.sidebarLayout,
            SidebarLayoutContent: paths.sidebarLayout,
            SidebarLayoutSidebar: paths.sidebarLayout,
            Switch: paths.switchComponent,
            SwitchField: paths.switchField,
            SwitchFieldController: paths.switchField,
            Table: paths.table,
            TableBody: paths.table,
            TableCaption: paths.table,
            TableCell: paths.table,
            TableFooter: paths.table,
            TableHead: paths.table,
            TableHeader: paths.table,
            TableRow: paths.table,
            Textarea: paths.textarea,
            TextareaField: paths.textareaField,
            TextareaFieldController: paths.textareaField,
            TextAreaInput: paths.textarea,
            TextInput: paths.input,
            Toaster: paths.toaster,
            useConfirmDialog: paths.useConfirmDialog,
            UseConfirmDialogRequestOptions: paths.useConfirmDialog,
            useConfirmDialogState: paths.useConfirmDialog,
            useControlledState: paths.hooksUseControlledState,
            useControllerMerged: paths.hooksUseControllerMerged,
          },
        ),
      },
    };
  },
});

export const CORE_REACT_COMPONENTS_IMPORTS = {
  task: coreReactComponentsImportsTask,
};
