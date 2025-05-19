import { toast } from '@halfdomelabs/ui-components';
import { flattenObject } from 'es-toolkit';
import { useEffect, useRef } from 'react';
import { type Control, type FieldValues, useFormState } from 'react-hook-form';

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

  if (import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- only want to run this check in dev mode for performance/usability reasons
    useEffect(() => {
      if (
        Object.keys(formState.dirtyFields).length === 0 &&
        formState.isDirty
      ) {
        // a bit of a hack to figure out what the issue is but OK since we only do this in dev mode
        const { _formValues, _defaultValues } = control;
        const formValueKeys = Object.keys(flattenObject(_formValues));
        const defaultValueKeys = Object.keys(flattenObject(_defaultValues));
        const missingKeys = formValueKeys.filter(
          (key) => !defaultValueKeys.includes(key),
        );

        toast.error(
          `Form is dirty but no fields are marked as dirty. This implies that there is likely a field ` +
            `is controlled but not set in defaultValues. This can be fixed by setting the default value to the field. ` +
            `Note: You will only see this error if you are running the app in dev mode. ` +
            `Missing fields: ${missingKeys.join(', ')}`,
        );
      }
    }, [formState.dirtyFields, formState.isDirty, control]);
  }

  useBlockerDialog({
    disableBlock: !formState.isDirty,
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
