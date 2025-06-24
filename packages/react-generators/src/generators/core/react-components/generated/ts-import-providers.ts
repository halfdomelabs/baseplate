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
  Alert: {},
  AlertIcon: {},
  BackButton: {},
  Button: {},
  ButtonGroup: {},
  buttonVariants: {},
  Card: {},
  CheckedInput: {},
  cn: {},
  ConfirmDialog: {},
  ErrorableLoader: {},
  ErrorDisplay: {},
  FormError: {},
  FormLabel: {},
  Input: {},
  inputVariants: {},
  Label: {},
  LinkButton: {},
  ListGroup: {},
  Loader: {},
  Modal: {},
  NotFoundCard: {},
  ReactDatePickerInput: {},
  ReactSelectInput: {},
  ScrollArea: {},
  SelectInput: {},
  Sidebar: {},
  Spinner: {},
  Status: { isTypeOnly: true },
  StatusType: { isTypeOnly: true },
  Table: {},
  TextAreaInput: {},
  TextInput: {},
  Toast: {},
  useConfirmDialog: {},
  UseConfirmDialogRequestOptions: { isTypeOnly: true },
  useConfirmDialogState: {},
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
            Alert: paths.index,
            AlertIcon: paths.index,
            BackButton: paths.index,
            Button: paths.index,
            ButtonGroup: paths.index,
            buttonVariants: paths.stylesButton,
            Card: paths.index,
            CheckedInput: paths.index,
            cn: paths.cn,
            ConfirmDialog: paths.index,
            ErrorableLoader: paths.index,
            ErrorDisplay: paths.index,
            FormError: paths.index,
            FormLabel: paths.index,
            Input: paths.index,
            inputVariants: paths.stylesInput,
            Label: paths.index,
            LinkButton: paths.index,
            ListGroup: paths.index,
            Loader: paths.index,
            Modal: paths.index,
            NotFoundCard: paths.index,
            ReactDatePickerInput: paths.index,
            ReactSelectInput: paths.index,
            ScrollArea: paths.index,
            SelectInput: paths.index,
            Sidebar: paths.index,
            Spinner: paths.index,
            Status: paths.useStatus,
            StatusType: paths.useStatus,
            Table: paths.index,
            TextAreaInput: paths.index,
            TextInput: paths.index,
            Toast: paths.index,
            useConfirmDialog: paths.useConfirmDialog,
            UseConfirmDialogRequestOptions: paths.useConfirmDialog,
            useConfirmDialogState: paths.useConfirmDialog,
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
