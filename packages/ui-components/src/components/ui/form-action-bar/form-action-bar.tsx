import type * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { MdOutlineSave } from 'react-icons/md';

import { cn } from '#src/utils/index.js';

import { Button } from '../button/button.js';

interface FormActionBarProps extends React.ComponentProps<'div'> {
  /**
   * React Hook Form instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- need to support any form return
  form?: UseFormReturn<any>;
  /**
   * Whether the form actions should be disabled (if undefined, will use (form.isSubmitting || !form.isDirty))
   */
  disabled?: boolean;
  /**
   * Whether to enable the save button even if the form is not dirty (useful when submitting data where defaults are allowed)
   */
  allowSaveWithoutDirty?: boolean;
  /**
   * Optional custom reset handler (defaults to form.reset)
   */
  onReset?: () => void;
  /**
   * Children to render (custom action buttons)
   */
  children?: React.ReactNode;
}

/**
 * A fixed bottom bar with form action buttons (Reset and Save).
 * Typically used at the bottom of forms to provide consistent action buttons.
 *
 * Can be used in two ways:
 * 1. With a react-hook-form instance: `<FormActionBar form={form} />`
 * 2. With individual props: `<FormActionBar disabled={isDisabled} onReset={handleReset} />`
 */
function FormActionBar(props: FormActionBarProps): React.ReactElement {
  const {
    className,
    disabled,
    children,
    form,
    onReset,
    allowSaveWithoutDirty,
    ...rest
  } = props;

  // Determine values based on whether form prop is provided
  const { formState } = form ?? {};
  const defaultSaveIsDisabled = formState
    ? formState.isSubmitting || (!allowSaveWithoutDirty && !formState.isDirty)
    : false;
  const defaultResetIsDisabled = formState
    ? formState.isSubmitting || !formState.isDirty
    : false;
  const isSaveDisabled = disabled ?? defaultSaveIsDisabled;
  const isResetDisabled = disabled ?? defaultResetIsDisabled;

  const handleReset = (): void => {
    form?.reset();
    onReset?.();
  };

  return (
    <div
      data-slot="form-action-bar"
      className={cn(
        'absolute inset-x-0 bottom-0 z-50 flex min-h-[var(--action-bar-height,52px)] items-center space-x-4 border-t border-border bg-background pl-4',
        className,
      )}
      {...rest}
    >
      {children ?? (
        <>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleReset}
            disabled={isResetDisabled}
          >
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            type="submit"
            disabled={isSaveDisabled}
          >
            <MdOutlineSave className="mr-2 h-4 w-4" />
            Save
          </Button>
        </>
      )}
    </div>
  );
}

export { FormActionBar };

export type { FormActionBarProps };
