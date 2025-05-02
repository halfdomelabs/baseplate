import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const reactComponentsImportsSchema = createTsImportMapSchema({
  Alert: {},
  AlertIcon: {},
  BackButton: {},
  Button: {},
  ButtonGroup: {},
  Card: {},
  CheckedInput: {},
  ConfirmDialog: {},
  ReactDatePickerInput: {},
  ErrorableLoader: {},
  ErrorDisplay: {},
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

export function createReactComponentsImports(
  importBase: string,
): ReactComponentsImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(reactComponentsImportsSchema, {
    Alert: path.join(importBase, 'components/index.js'),
    AlertIcon: path.join(importBase, 'components/index.js'),
    BackButton: path.join(importBase, 'components/index.js'),
    Button: path.join(importBase, 'components/index.js'),
    ButtonGroup: path.join(importBase, 'components/index.js'),
    Card: path.join(importBase, 'components/index.js'),
    CheckedInput: path.join(importBase, 'components/index.js'),
    ConfirmDialog: path.join(importBase, 'components/index.js'),
    ReactDatePickerInput: path.join(importBase, 'components/index.js'),
    ErrorableLoader: path.join(importBase, 'components/index.js'),
    ErrorDisplay: path.join(importBase, 'components/index.js'),
    FormError: path.join(importBase, 'components/index.js'),
    FormLabel: path.join(importBase, 'components/index.js'),
    LinkButton: path.join(importBase, 'components/index.js'),
    ListGroup: path.join(importBase, 'components/index.js'),
    Modal: path.join(importBase, 'components/index.js'),
    NotFoundCard: path.join(importBase, 'components/index.js'),
    ReactSelectInput: path.join(importBase, 'components/index.js'),
    SelectInput: path.join(importBase, 'components/index.js'),
    Sidebar: path.join(importBase, 'components/index.js'),
    Spinner: path.join(importBase, 'components/index.js'),
    Status: path.join(importBase, 'hooks/useStatus.js'),
    StatusType: path.join(importBase, 'hooks/useStatus.js'),
    Table: path.join(importBase, 'components/index.js'),
    TextAreaInput: path.join(importBase, 'components/index.js'),
    TextInput: path.join(importBase, 'components/index.js'),
    Toast: path.join(importBase, 'components/index.js'),
    useConfirmDialog: path.join(importBase, 'hooks/useConfirmDialog.js'),
    UseConfirmDialogRequestOptions: path.join(
      importBase,
      'hooks/useConfirmDialog.js',
    ),
    useConfirmDialogState: path.join(importBase, 'hooks/useConfirmDialog.js'),
    useStatus: path.join(importBase, 'hooks/useStatus.js'),
    useToast: path.join(importBase, 'hooks/useToast.js'),
  });
}
