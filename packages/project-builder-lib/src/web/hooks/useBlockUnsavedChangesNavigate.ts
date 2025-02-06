import type { FieldValues, FormState } from 'react-hook-form';

import { useRef } from 'react';

import { hasDirtyFields } from '../utils/form.js';
import { useBlockerDialog } from './useBlockerDialog.js';

export function useBlockUnsavedChangesNavigate<
  TFieldValues extends FieldValues = FieldValues,
>(
  formState: FormState<TFieldValues>,
  {
    reset,
    onSubmit,
  }: {
    reset: () => void;
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  },
): void {
  // a bit of a hack to make sure we get the latest form state before continuing
  const isDirtyRef = useRef(false);
  isDirtyRef.current = formState.isDirty;

  useBlockerDialog({
    disableBlock: !hasDirtyFields(formState),
    title: 'Unsaved Changes',
    content: 'You have unsaved changes. Do you want to save your changes?',
    buttonContinueWithoutSaveText: 'Discard Changes',
    onContinueWithoutSave: () => {
      reset();
      return true;
    },
    buttonContinueText: 'Save',
    onContinue: async () => {
      await onSubmit();
      // // a bit of a hack to make sure we get the latest form state before continuing
      return !isDirtyRef.current;
    },
  });
}
