'use client';

import type { Extension } from '@codemirror/state';
import type { ComponentPropsWithRef } from 'react';
import type {
  Control,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from 'react-hook-form';

import { javascript } from '@codemirror/lang-javascript';
import { EditorView, tooltips } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';

import type { FormFieldProps } from '#src/types/form.js';

import { useControllerMerged } from '#src/hooks/use-controller-merged.js';
import { useFieldIds } from '#src/hooks/use-field-ids.js';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../field/field.js';

const NO_EXTENSIONS: Extension[] = [];

export interface CodeEditorFieldProps
  extends
    Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'value' | 'children'>,
    FormFieldProps {
  onChange?: (value: string) => void;
  value?: string;
  language?: 'javascript' | 'typescript' | 'json';
  extensions?: Extension[];
  height?: string;
  placeholder?: string;
  readOnly?: boolean;
}

function CodeEditorField({
  label,
  description,
  error,
  disabled,
  onChange,
  value = '',
  language = 'javascript',
  extensions = NO_EXTENSIONS,
  height = '120px',
  placeholder,
  readOnly = false,
  className,
  'aria-describedby': ariaDescribedBy,
  ...props
}: CodeEditorFieldProps): React.ReactElement {
  const { labelId, describedBy, descriptionProps, errorProps } = useFieldIds({
    'aria-describedby': ariaDescribedBy,
    description,
    error,
  });
  const labelledBy = label ? labelId : undefined;

  // Get the language extension
  const languageExtension = useMemo(() => {
    if (language === 'javascript' || language === 'typescript') {
      return javascript({ typescript: language === 'typescript' });
    }
    return [];
  }, [language]);

  // Combine language extension with custom extensions
  // Use tooltips with parent: document.body to ensure tooltips escape dialog containers
  // ARIA goes on the editable `.cm-content` element rather than the wrapper,
  // so it has to be applied as an extension.
  const allExtensions = useMemo(
    () => [
      languageExtension,
      tooltips({ parent: document.body }),
      EditorView.contentAttributes.of({
        ...(labelledBy ? { 'aria-labelledby': labelledBy } : {}),
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        'aria-invalid': String(!!error),
      }),
      ...extensions,
    ],
    [languageExtension, extensions, labelledBy, describedBy, error],
  );

  return (
    <Field data-invalid={!!error} data-disabled={disabled ?? undefined}>
      {(!!label || !!description) && (
        <FieldContent>
          {label && <FieldLabel id={labelId}>{label}</FieldLabel>}
          {description && (
            <FieldDescription {...descriptionProps}>
              {description}
            </FieldDescription>
          )}
        </FieldContent>
      )}
      <div className={className} {...props}>
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={allExtensions}
          height={height}
          placeholder={placeholder}
          readOnly={readOnly || disabled}
          editable={!disabled}
          basicSetup={true}
          indentWithTab={false}
          style={{
            fontSize: '14px',
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        />
      </div>
      <FieldError {...errorProps}>{error}</FieldError>
    </Field>
  );
}

interface CodeEditorFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<CodeEditorFieldProps, 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
  rules?: RegisterOptions<TFieldValues, TFieldName>;
}

function CodeEditorFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  ...rest
}: CodeEditorFieldControllerProps<
  TFieldValues,
  TFieldName
>): React.ReactElement {
  const {
    field,
    fieldState: { error },
  } = useControllerMerged({ name, control, rules }, rest);

  return <CodeEditorField error={error?.message} {...rest} {...field} />;
}

export { CodeEditorField, CodeEditorFieldController };
