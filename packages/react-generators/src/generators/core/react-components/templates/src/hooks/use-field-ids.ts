// @ts-nocheck

import { useId } from 'react';

export interface UseFieldIdsOptions {
  /** Id for the control. A generated id is used when omitted. */
  id?: string;
  /** Extra ids describing the control, kept ahead of the generated ones. */
  'aria-describedby'?: string;
  /** The description that will be rendered, if any. */
  description?: React.ReactNode;
  /** The error that will be rendered, if any. */
  error?: React.ReactNode;
}

export interface UseFieldIdsResult {
  fieldId: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
  /** `aria-describedby` value, or undefined when nothing describes the control. */
  describedBy: string | undefined;
  labelProps: { htmlFor: string };
  controlProps: { id: string; 'aria-describedby': string | undefined };
  descriptionProps: { id: string };
  errorProps: { id: string };
}

/**
 * Generates the coordinated ids a form field needs to associate its label,
 * description and error with its control.
 *
 * Only slots with content are referenced by `aria-describedby`:
 * `FieldDescription` renders an empty `<p>` when there is no description.
 */
export function useFieldIds({
  id,
  'aria-describedby': ariaDescribedBy,
  description,
  error,
}: UseFieldIdsOptions = {}): UseFieldIdsResult {
  const generatedId = useId();

  const fieldId = id ?? `${generatedId}-form-item`;
  const labelId = `${generatedId}-form-item-label`;
  const descriptionId = `${generatedId}-form-item-description`;
  const errorId = `${generatedId}-form-item-message`;

  const describedByIds = [
    ariaDescribedBy,
    description ? descriptionId : undefined,
    error ? errorId : undefined,
  ].filter(Boolean);

  const describedBy = describedByIds.join(' ') || undefined;

  return {
    fieldId,
    labelId,
    descriptionId,
    errorId,
    describedBy,
    labelProps: { htmlFor: fieldId },
    controlProps: { id: fieldId, 'aria-describedby': describedBy },
    descriptionProps: { id: descriptionId },
    errorProps: { id: errorId },
  };
}
