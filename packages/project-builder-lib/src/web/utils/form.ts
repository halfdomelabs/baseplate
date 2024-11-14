import type { FieldValues, FormState } from 'react-hook-form';

export function setUndefinedIfEmpty(value: unknown): unknown {
  if (value === '') return undefined;
  return value;
}

export function hasDirtyFields<TFieldValues extends FieldValues = FieldValues>(
  formState: FormState<TFieldValues>,
): boolean {
  return Object.keys(formState.dirtyFields).length > 0;
}
