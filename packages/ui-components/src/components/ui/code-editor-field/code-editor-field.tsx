'use client';

import type { Extension } from '@codemirror/state';
import type { ComponentPropsWithRef } from 'react';
import type {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from 'react-hook-form';

import { javascript } from '@codemirror/lang-javascript';
import { tooltips } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';
import { Controller, get, useFormState } from 'react-hook-form';

import type { FormFieldProps } from '#src/types/form.js';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '../form-item/form-item.js';

export interface CodeEditorFieldProps
  extends Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'value' | 'children'>,
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
  onChange,
  value = '',
  language = 'javascript',
  extensions = [],
  height = '120px',
  placeholder,
  readOnly = false,
  className,
  ...props
}: CodeEditorFieldProps): React.ReactElement {
  // Get the language extension
  const languageExtension = useMemo(() => {
    if (language === 'javascript' || language === 'typescript') {
      return javascript({ typescript: language === 'typescript' });
    }
    return [];
  }, [language]);

  // Combine language extension with custom extensions
  // Use tooltips with parent: document.body to ensure tooltips escape dialog containers
  const allExtensions = useMemo(
    () => [
      languageExtension,
      tooltips({ parent: document.body }),
      ...extensions,
    ],
    [languageExtension, extensions],
  );

  return (
    <FormItem error={error}>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <div className={className} {...props}>
          <CodeMirror
            value={value}
            onChange={onChange}
            extensions={allExtensions}
            height={height}
            placeholder={placeholder}
            readOnly={readOnly}
            basicSetup={true}
            style={{
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
          />
        </div>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}

export interface CodeEditorFieldControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<CodeEditorFieldProps, 'onChange' | 'value'> {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

function CodeEditorFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  registerOptions,
  ...rest
}: CodeEditorFieldControllerProps<
  TFieldValues,
  TFieldName
>): React.ReactElement {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <Controller
      control={control}
      name={name}
      rules={registerOptions}
      render={({ field }) => (
        <CodeEditorField
          value={field.value as string}
          onChange={field.onChange}
          error={error?.message}
          {...rest}
        />
      )}
    />
  );
}

export { CodeEditorField, CodeEditorFieldController };
