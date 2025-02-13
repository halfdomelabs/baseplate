import type { FieldValues, UseFormProps, UseFormReturn } from 'react-hook-form';

import { toast } from '@halfdomelabs/ui-components';
import { isEqual } from 'es-toolkit';
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
  const { updatedExternally } = useProjectDefinition();

  const oldValues = useRef<{
    oldDefaultValues: unknown;
  }>();

  useEffect(() => {
    if (
      oldValues.current &&
      !isEqual(oldValues.current.oldDefaultValues, props?.defaultValues)
    ) {
      reset(props?.defaultValues as TFieldValues);
      if (isDirty && updatedExternally) {
        toast.warning('Contents were updated externally so form was reset!');
      }
    }
    if (
      !oldValues.current ||
      !isEqual(oldValues.current.oldDefaultValues, props?.defaultValues)
    ) {
      oldValues.current = {
        oldDefaultValues: props?.defaultValues,
      };
    }
  }, [props?.defaultValues, reset, updatedExternally, isDirty]);

  return formProps;
}
