import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@halfdomelabs/ui-components';
import { MdOutlineSave } from 'react-icons/md';

interface FormActionBarProps {
  // we don't care about the form type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  disabled?: boolean;
}

const FormActionBar = ({
  form,
  disabled,
}: FormActionBarProps): React.JSX.Element => {
  const { formState } = form;
  const isDirty = Object.keys(formState.dirtyFields).length > 0;

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 flex min-h-[--action-bar-height] items-center space-x-4 border-t border-border bg-white pl-4">
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => {
          form.reset();
        }}
        disabled={formState.isSubmitting || !isDirty || disabled}
      >
        Reset
      </Button>
      <Button.WithIcon
        icon={MdOutlineSave}
        variant="default"
        size="sm"
        type="submit"
        disabled={formState.isSubmitting || !isDirty || disabled}
      >
        Save
      </Button.WithIcon>
    </div>
  );
};

export default FormActionBar;
