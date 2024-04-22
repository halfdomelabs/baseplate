import { FieldValues, FormState } from 'react-hook-form';

import { useBlockerDialog } from './useBlockerDialog';
import { hasDirtyFields } from '@src/utils/form';

export function useBlockDirtyFormNavigate<
  TFieldValues extends FieldValues = FieldValues,
>(formState: FormState<TFieldValues>): void {
  useBlockerDialog({
    disableBlock: !hasDirtyFields(formState),
    title: 'Unsaved Changes',
    content: 'You have unsaved changes. Are you sure you want to leave?',
  });
}
