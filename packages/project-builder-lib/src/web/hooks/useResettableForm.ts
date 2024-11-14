import type { FieldValues, UseFormProps, UseFormReturn } from 'react-hook-form';

import { toast } from '@halfdomelabs/ui-components';
import _ from 'lodash';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { useProjectDefinition } from './useProjectDefinition.js';

export function useResettableForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
>(
  props?: UseFormProps<TFieldValues, TContext>,
): UseFormReturn<TFieldValues, TContext> {
  const formProps = useForm(props);
  const { reset, formState } = formProps;
  const { isDirty } = formState;
  const { externalChangeCounter } = useProjectDefinition();

  const oldValues = useRef<{
    externalChangeCounter: number;
    oldDefaultValues: unknown;
  }>();

  useEffect(() => {
    if (
      oldValues.current &&
      !_.isEqual(oldValues.current.oldDefaultValues, props?.defaultValues)
    ) {
      reset(props?.defaultValues as TFieldValues);
      if (
        isDirty &&
        oldValues.current.externalChangeCounter !== externalChangeCounter
      ) {
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
  }, [props?.defaultValues, reset, externalChangeCounter, isDirty]);

  return formProps;
}
