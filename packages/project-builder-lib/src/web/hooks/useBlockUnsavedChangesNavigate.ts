import { useRef } from 'react';
import { type Control, type FieldValues, useFormState } from 'react-hook-form';

import { hasDirtyFields } from '../utils/form.js';
import { useBlockerDialog } from './useBlockerDialog.js';

export function useBlockUnsavedChangesNavigate<
  TFieldValues extends FieldValues = FieldValues,
>({
  control,
  reset,
  onSubmit,
}: {
  control: Control<TFieldValues>;
  reset: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}): void {
  const isDirtyRef = useRef(false);
  const formState = useFormState({ control });
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
      // a bit of a hack to make sure we get the latest form state before continuing
      // there's not an easy way of figuring out if the submission was successful or not
      // so we wait for a React re-render and then check if the form is still dirty
      await new Promise((resolve) => setTimeout(resolve, 1));
      return !isDirtyRef.current;
    },
  });
}
