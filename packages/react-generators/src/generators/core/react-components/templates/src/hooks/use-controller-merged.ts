// @ts-nocheck

import type { ForwardedRef } from 'react';
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseControllerProps,
  UseControllerReturn,
} from 'react-hook-form';

import { useController } from 'react-hook-form';

import { mergeRefs } from '../utils/merge-refs.js';

interface UseControllerMergedOptions<TValue, TRef> {
  onChange?: (value: TValue) => void;
  onBlur?: React.FocusEventHandler<TRef>;
  disabled?: boolean;
}

/**
 * A hook to wrap useController from react-hook-form that allows
 * passing in properties and refs that will be merged with the
 * controller's properties and ref.
 */
export function useControllerMerged<
  TValue,
  TRef,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: UseControllerProps<TFieldValues, TName>,
  options: UseControllerMergedOptions<TValue, TRef>,
  ref?: ForwardedRef<TRef>,
): Omit<UseControllerReturn<TFieldValues, TName>, 'field'> & {
  field: Omit<
    ControllerRenderProps,
    'ref' | 'onChange' | 'value' | 'onBlur'
  > & {
    ref: ForwardedRef<TRef> | undefined;
    onChange: (value: TValue) => void;
    value: TValue;
    onBlur: React.FocusEventHandler<TRef>;
  };
} {
  const { onChange, onBlur, disabled } = options;
  const controllerReturnValue = useController({
    ...props,
    disabled: props.disabled,
  });
  const { field } = controllerReturnValue;

  return {
    ...controllerReturnValue,
    field: {
      ...field,
      ref: mergeRefs(field.ref, ref),
      onChange: (value: TValue) => {
        field.onChange(value);
        onChange?.(value);
      },
      onBlur: (e) => {
        field.onBlur();
        onBlur?.(e);
      },
      disabled: disabled ?? field.disabled,
    },
  };
}
