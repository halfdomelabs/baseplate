import type { FormFieldProps } from '#src/types/form.js';

/** Copy a field component supplies so its matrix reads like the real thing. */
export interface FieldStateCopy {
  label: string;
  description: string;
  error: string;
}

export type FieldStateName =
  | 'Default'
  | 'WithLabel'
  | 'WithDescription'
  | 'DescriptionWithoutLabel'
  | 'WithError'
  | 'ErrorOnly'
  | 'Disabled';

/**
 * The label/description/error matrix every `*Field` component is documented
 * against. The states are identical across components on purpose: a
 * `storybook:snap` diff of a field refactor is only readable when the same
 * story id means the same thing everywhere.
 */
export function createFieldStates(
  copy: FieldStateCopy,
): Record<FieldStateName, FormFieldProps> {
  return {
    Default: {},
    WithLabel: { label: copy.label },
    WithDescription: { label: copy.label, description: copy.description },
    DescriptionWithoutLabel: { description: copy.description },
    WithError: {
      label: copy.label,
      description: copy.description,
      error: copy.error,
    },
    ErrorOnly: { error: copy.error },
    Disabled: {
      label: copy.label,
      description: copy.description,
      disabled: true,
    },
  };
}
