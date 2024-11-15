import type { FieldValues, FormState } from 'react-hook-form';

import { hasDirtyFields } from '../utils/form.js';
import { useBlockerDialog } from './useBlockerDialog.js';

export function useBlockDirtyFormNavigate<
  TFieldValues extends FieldValues = FieldValues,
>(formState: FormState<TFieldValues>, reset: () => void): void {
  useBlockerDialog({
    disableBlock: !hasDirtyFields(formState),
    title: 'Unsaved Changes',
    content: 'You have unsaved changes. Are you sure you want to continue?',
    buttonContinueText: 'Discard Changes',
    onContinue: () => {
      reset();
      return true;
    },
  });
}
