import { FieldValues, FormState } from 'react-hook-form';

import { useBlockerDialog } from './useBlockerDialog.js';
import { hasDirtyFields } from '../utils/form.js';

export function useBlockDirtyFormNavigate<
  TFieldValues extends FieldValues = FieldValues,
>(formState: FormState<TFieldValues>, reset: () => void): void {
  useBlockerDialog({
    disableBlock: !hasDirtyFields(formState),
    title: 'Unsaved Changes',
    content: 'You have unsaved changes. Are you sure you want to continue?',
    onContinue: reset,
  });
}
