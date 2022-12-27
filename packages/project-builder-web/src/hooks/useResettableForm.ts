import _ from 'lodash';
import { useEffect, useRef } from 'react';
import {
  FieldValues,
  useForm,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';
import { useProjectConfig } from './useProjectConfig';
import { useToast } from './useToast';

export function useResettableForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown
>(
  props?: UseFormProps<TFieldValues, TContext>
): UseFormReturn<TFieldValues, TContext> {
  const formProps = useForm(props);
  const { reset, formState } = formProps;
  const { isDirty } = formState;
  const toast = useToast();
  const { externalChangeCounter } = useProjectConfig();

  const oldValues = useRef<{
    externalChangeCounter: number;
    oldDefaultValues: unknown;
  }>();

  useEffect(() => {
    if (
      oldValues.current &&
      !_.isEqual(oldValues.current.oldDefaultValues, props?.defaultValues) &&
      oldValues.current.externalChangeCounter !== externalChangeCounter
    ) {
      reset(props?.defaultValues);
      if (isDirty) {
        toast.warning('Contents were updated externally so form was reset!');
      }
    }
    if (
      !oldValues.current ||
      !_.isEqual(oldValues.current.oldDefaultValues, props?.defaultValues)
    ) {
      oldValues.current = {
        externalChangeCounter,
        oldDefaultValues: props?.defaultValues,
      };
    }
  }, [props?.defaultValues, reset, externalChangeCounter, toast, isDirty]);

  return formProps;
}
