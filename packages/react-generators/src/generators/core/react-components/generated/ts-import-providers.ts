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
  AlertIcon: {},
  BackButton: {},
  Button: {},
  ButtonGroup: {},
  buttonVariants: {},
  Card: {},
  CheckedInput: {},
  cn: {},
  Combobox: {},
  ConfirmDialog: {},
  ErrorableLoader: {},
  ErrorDisplay: {},
  FormError: {},
  FormFieldProps: { isTypeOnly: true },
  FormLabel: {},
  Input: {},
  InputField: {},
  InputFieldController: {},
  inputVariants: {},
  Label: {},
  LinkButton: {},
  ListGroup: {},
  Loader: {},
  mergeRefs: {},
  Modal: {},
  MultiSelectOptionProps: { isTypeOnly: true },
  NotFoundCard: {},
  ReactDatePickerInput: {},
  ReactSelectInput: {},
  ScrollArea: {},
  Select: {},
  selectCheckVariants: {},
  selectContentVariants: {},
  SelectInput: {},
  selectItemVariants: {},
  SelectOptionProps: { isTypeOnly: true },
  selectTriggerVariants: {},
  Sidebar: {},
  Spinner: {},
  Status: { isTypeOnly: true },
  StatusType: { isTypeOnly: true },
  Table: {},
  TextArea: {},
  TextAreaInput: {},
  TextInput: {},
  Toast: {},
  useConfirmDialog: {},
  UseConfirmDialogRequestOptions: { isTypeOnly: true },
  useConfirmDialogState: {},
  useControlledState: {},
  useStatus: {},
  useToast: {},
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
            Alert: paths.index,
            AlertIcon: paths.index,
            BackButton: paths.index,
            Button: paths.index,
            ButtonGroup: paths.index,
            buttonVariants: paths.stylesButton,
            Card: paths.index,
            CheckedInput: paths.index,
            cn: paths.cn,
            Combobox: paths.index,
            ConfirmDialog: paths.index,
            ErrorableLoader: paths.index,
            ErrorDisplay: paths.index,
            FormError: paths.index,
            FormFieldProps: paths.typesForm,
            FormLabel: paths.index,
            Input: paths.index,
            InputField: paths.index,
            InputFieldController: paths.index,
            inputVariants: paths.stylesInput,
            Label: paths.index,
            LinkButton: paths.index,
            ListGroup: paths.index,
            Loader: paths.index,
            mergeRefs: paths.mergeRefs,
            Modal: paths.index,
            MultiSelectOptionProps: paths.typesForm,
            NotFoundCard: paths.index,
            ReactDatePickerInput: paths.index,
            ReactSelectInput: paths.index,
            ScrollArea: paths.index,
            Select: paths.index,
            selectCheckVariants: paths.stylesSelect,
            selectContentVariants: paths.stylesSelect,
            SelectInput: paths.index,
            selectItemVariants: paths.stylesSelect,
            SelectOptionProps: paths.typesForm,
            selectTriggerVariants: paths.stylesSelect,
            Sidebar: paths.index,
            Spinner: paths.index,
            Status: paths.useStatus,
            StatusType: paths.useStatus,
            Table: paths.index,
            TextArea: paths.index,
            TextAreaInput: paths.index,
            TextInput: paths.index,
            Toast: paths.index,
            useConfirmDialog: paths.useConfirmDialog,
            UseConfirmDialogRequestOptions: paths.useConfirmDialog,
            useConfirmDialogState: paths.useConfirmDialog,
            useControlledState: paths.hooksUseControlledState,
            useStatus: paths.useStatus,
            useToast: paths.useToast,
          },
        ),
      },
    };
  },
});

export const CORE_REACT_COMPONENTS_IMPORTS = {
  task: coreReactComponentsImportsTask,
};
